#include <iostream>
#include <cmath>
#include <limits>
#include <chrono>
#include <atomic>
#include <string>
#include <thread>
#include <mutex>
#include <spdlog/spdlog.h>
#include <soci/soci.h>
#include "cctPostgresService.hpp"
#include "postgresql.hpp"
#include "events.hpp"
#include "unpackCCTJSON.hpp"

using namespace CCTService;

class CCTPostgresService::CCTPostgresServiceImpl
{
public:
    CCTPostgresServiceImpl(
        std::unique_ptr<PostgreSQL> &&connection,
        const std::set<std::string> &schemas)
    {
        if (connection == nullptr)
        {
            throw std::invalid_argument("Connection is NULL");
        }
        if (!connection->isConnected())
        {
            throw std::invalid_argument("Not connected");
        }
        if (schemas.empty()){throw std::invalid_argument("No schemas set");}
        mSchemas = schemas;
        mConnection = std::move(connection);
        for (const auto &schema : mSchemas)
        {
            mEventsMap.insert( std::pair {schema, Events{}} );
        }
        for (const auto &schema : mSchemas)
        {
            initialQuery(schema);
        }
    }
    ~CCTPostgresServiceImpl()
    {
        stop();
    }
    [[nodiscard]] bool isRunning() const noexcept
    {
        return mRunning;
    }
    void initialQuery(const std::string &schema)
    {
        spdlog::debug("Querying events from " + schema + "...");
        if (!mConnection->isConnected())
        {
            spdlog::warn("Reconnecting to CCT postgres");
            mConnection->connect();
        }
        if (!mConnection->isConnected())
        {
            spdlog::warn("CCT postgres connection broken");
            return;
        }
        auto session
             = reinterpret_cast<soci::session *> (mConnection->getSession());
        soci::rowset<soci::row> rows
            = (session->prepare <<
                "SELECT identifier, CAST(mw_data AS TEXT), cct_magnitude, cct_magnitude_type, authoritative_magnitude, authoritative_magnitude_type, review_status, creation_mode, EXTRACT(epoch FROM last_update) FROM "
              + schema + ".event ORDER BY load_date DESC LIMIT 50");
        double newestUpdate = std::numeric_limits<double>::lowest();
        for (soci::rowset<soci::row>::const_iterator it = rows.begin();
             it != rows.end();
             ++it)
        {
            const auto &row = *it;
            try
            {
                auto identifier = row.get<long long> (0);
                auto sIdentifier = std::to_string(identifier);
                auto json = nlohmann::json::parse(row.get<std::string> (1));
                auto eventDetails
                    = ::unpackCCTJSON(json, std::to_string(identifier));
                eventDetails.emplace("cctMagnitude",
                                     row.get<double> (2));
                eventDetails.emplace("cctMagnitudeType",
                                     row.get<std::string> (3));
                eventDetails.emplace("authoritativeMagnitude",
                                     row.get<double> (4));
                eventDetails.emplace("authoritativeMagnitudeType",
                                     row.get<std::string> (5));
                eventDetails.emplace("reviewStatus",
                                     row.get<std::string> (6));
                eventDetails.emplace("creationMode",
                                     row.get<std::string> (7));
                double lastUpdate = row.get<double> (8);
                newestUpdate = std::max(lastUpdate, newestUpdate);
                //std::cout << std::setw(4) << eventDetails << std::endl;
                Event event{eventDetails, json};
                {
                std::scoped_lock lock(mMutex);
                mEventsMap.at(schema).insert(std::pair {sIdentifier, std::move(event)});
                }
            }
            catch (const std::exception &e)
            {
                spdlog::warn("Failed to unpack event; failed with: "
                           + std::string {e.what()});
            }
        }
        mEventsMap.at(schema).generateHash();
        mLastUpdateMap.insert(std::pair {schema, newestUpdate});
        spdlog::debug("Done querying events for schema " + schema);
    }
    void updateQuery(const std::string &schema)
    {
        spdlog::debug("Performing update query from " + schema + "...");
        if (!mConnection->isConnected())
        {
            spdlog::warn("Reconnecting to CCT postgres");
            mConnection->connect();
        }
        if (!mConnection->isConnected())
        {
            spdlog::warn("CCT postgres connection broken");
            return;
        }
        if (!mLastUpdateMap.contains(schema))
        {
            throw std::runtime_error("Can't find last update time for " + schema);
        }
        double newestUpdate = mLastUpdateMap[schema];
        auto session
             = reinterpret_cast<soci::session *> (mConnection->getSession());
        soci::rowset<soci::row> rows
            = (session->prepare <<
                "SELECT identifier, CAST(mw_data AS TEXT), cct_magnitude, cct_magnitude_type, authoritative_magnitude, authoritative_magnitude_type, review_status, creation_mode, EXTRACT(epoch FROM last_update) FROM "
              + schema + ".event "
              + " WHERE " + schema + ".event.last_update > TO_TIMESTAMP(" + std::to_string(newestUpdate) + ") "
              + " ORDER BY load_date DESC");
        bool updated{false};
        for (soci::rowset<soci::row>::const_iterator it = rows.begin();
             it != rows.end();
             ++it)
        {
            const auto &row = *it;
            try
            {
                auto identifier = row.get<long long> (0);
                auto sIdentifier = std::to_string(identifier);
                auto json = nlohmann::json::parse(row.get<std::string> (1));
                auto eventDetails
                    = ::unpackCCTJSON(json, std::to_string(identifier));
                eventDetails.emplace("cctMagnitude",
                                     row.get<double> (2));
                eventDetails.emplace("cctMagnitudeType",
                                     row.get<std::string> (3));
                eventDetails.emplace("authoritativeMagnitude",
                                     row.get<double> (4));
                eventDetails.emplace("authoritativeMagnitudeType",
                                     row.get<std::string> (5));
                eventDetails.emplace("reviewStatus",
                                     row.get<std::string> (6));
                eventDetails.emplace("creationMode",
                                     row.get<std::string> (7));
                double lastUpdate = row.get<double> (8);
                Event event{eventDetails, json};
                {
                std::scoped_lock lock(mMutex);
                if (!mEventsMap.at(schema).contains(sIdentifier))
                {
                    spdlog::info("Adding " + sIdentifier);
                    mEventsMap.at(schema).insert(std::pair {sIdentifier, std::move(event)});
                }
                else
                {
                    spdlog::info("Updating " + sIdentifier);
                    mEventsMap[schema].update(std::pair {sIdentifier, std::move(event)});
                }
                }
                newestUpdate = std::max(lastUpdate, newestUpdate);
                updated = true;
            }
            catch (const std::exception &e)
            {
                spdlog::warn("Failed to unpack event; failed with: "
                           + std::string {e.what()});
            }
        }
        if (updated)
        {
            mLastUpdateMap[schema] = newestUpdate;
            // N.B. This can be out of sync with a poller since the events were
            // updated but the hash wasn't until now.  However, a poller will
            // loop back around and compare hashes again in due time so this 
            // problem will resolve itself.
            mEventsMap.at(schema).generateHash();
        }
    }
    void start()
    {
        stop();
        setRunning(true);
        mThread = std::thread(&CCTPostgresServiceImpl::run, this);
    }
    void run()
    {
        while (isRunning())
        {
            auto now 
                = std::chrono::duration_cast<std::chrono::seconds> (
                    std::chrono::system_clock::now().time_since_epoch());
            if (now > mLastQuery + mQueryInterval)
            {
                // Perform update query
                for (const auto &schema : mSchemas)
                {
                    try
                    {
                        updateQuery(schema); 
                    }
                    catch (const std::exception &e)
                    {
                        spdlog::error("Failed to perform update query on " + schema
                                    + "; failed with "
                                    + std::string {e.what()});
                    }
                }
                mLastQuery = now;
            }
            std::this_thread::sleep_for(std::chrono::seconds (1));
            
        }
    }
    void setRunning(bool running)
    {
        mRunning = running;
    }
    void stop()
    {
        setRunning(false);
        if (mThread.joinable()){mThread.join();}
    } 
    /// Have event?
    [[nodiscard]] bool haveEvent(const std::string &schema,
                                 const std::string &event) const noexcept
    {
        if (!mEventsMap.contains(schema)){return false;}
        std::scoped_lock lock(mMutex);
        return mEventsMap.at(schema).contains(event); 
    } 
    /// Lightweight data to string
    [[nodiscard]] std::string lightWeightDataToString(const std::string &schema,
                                                      const int indent) const
    {
        std::scoped_lock lock(mMutex);
        return mEventsMap.at(schema).lightWeightDataToString(indent);
    }   
    /// Heavyweight data to string
    [[nodiscard]] std::string heavyWeightDataToString(const std::string &schema,
                                                      const std::string &eventIdentifier,
                                                      const int indent) const
    {
        std::scoped_lock lock(mMutex);
        return mEventsMap.at(schema).heavyWeightDataToString(eventIdentifier, indent);
    }
    [[nodiscard]] size_t getCurrentHash(const std::string &schema) const
    {
        if (!mEventsMap.contains(schema)){return 0;}
        std::scoped_lock lock(mMutex);
        return mEventsMap.at(schema).getHash();
    }
//private:
    mutable std::mutex mMutex;
    std::unique_ptr<PostgreSQL> mConnection{nullptr};
    std::thread mThread;
    std::set<std::string> mSchemas;
    std::map<std::string, Events> mEventsMap;
    std::map<std::string, double> mLastUpdateMap;
    std::chrono::seconds mLastQuery{0};
    std::chrono::seconds mQueryInterval{5*60};
    std::atomic<bool> mRunning{false};
    //double mLastUpdate{std::numeric_limits<double>::lowest()};
};

/// Constructor
CCTPostgresService::CCTPostgresService(
    std::unique_ptr<PostgreSQL> &&connection,
    const std::set<std::string> &schemas) :
    pImpl(std::make_unique<CCTPostgresServiceImpl> (std::move(connection), schemas))
{
}

/// Destructor
CCTPostgresService::~CCTPostgresService() = default;

/// Running?
bool CCTPostgresService::isRunning() const noexcept
{
    return pImpl->isRunning();
}

/// Stop
void CCTPostgresService::stop()
{
    pImpl->stop();
}

/// Start
void CCTPostgresService::start()
{
    if (pImpl->mConnection == nullptr)
    {
        throw std::runtime_error("Connection not set");
    }
    spdlog::info("Starting CCT database poller");
    pImpl->start();
}

/// Have event?
bool CCTPostgresService::haveEvent(const std::string &schema,
                                   const std::string &event) const noexcept
{
    return pImpl->haveEvent(schema, event); 
}

/// Schemas
std::set<std::string> CCTPostgresService::getSchemas() const noexcept
{
    return pImpl->mSchemas;
}

/// Have schema?
bool CCTPostgresService::haveSchema(const std::string &schema) const noexcept
{
    return pImpl->mSchemas.contains(schema);
}

/// Lightweight data
std::string CCTPostgresService::lightWeightDataToString(
    const std::string &schema,
    const int indent) const
{
    return pImpl->lightWeightDataToString(schema, indent);
}

/// Heavyweight data
std::string CCTPostgresService::heavyWeightDataToString(
    const std::string &schema,
    const std::string &identifier,
    const int indent) const
{
    return pImpl->heavyWeightDataToString(schema, identifier, indent);
}

size_t CCTPostgresService::getCurrentHash(const std::string &schema) const
{
    return pImpl->getCurrentHash(schema);
}
