#include <soci/soci.h>
#include "aqmsPostgresHandler.hpp"
#include "postgresql.hpp"
#include "aqms.hpp"

using namespace CCTService;

class AQMSPostgresHandler::AQMSPostgresHandlerImpl
{
public:
    explicit AQMSPostgresHandlerImpl(std::unique_ptr<PostgreSQL> &&connection)
    {
        if (connection == nullptr)
        {
            throw std::invalid_argument("AQMS database connection is NULL");
        }
        mConnection = std::move(connection);
    }
    std::unique_ptr<PostgreSQL> mConnection{nullptr};
};

/// Constructor
AQMSPostgresHandler::AQMSPostgresHandler(
    std::unique_ptr<PostgreSQL> &&connection) :
    pImpl(std::make_unique<AQMSPostgresHandlerImpl> (std::move(connection)))
{
}

/// Get prefor 
int64_t AQMSPostgresHandler::getPreferredOriginIdentifier(
    const std::string &eventIdentifier) const
{
    if (eventIdentifier.empty())
    {
        throw std::invalid_argument("Event identifier is empty");
    }
    int64_t identifier{-1};
    try
    {
        identifier = std::stol(eventIdentifier);     
    }
    catch (...)
    {
        try
        {
            // Might be in form of uu8238239 so pop uu
            auto temporaryIdentifier = eventIdentifier;
            if (temporaryIdentifier.size() > 2)
            {
                temporaryIdentifier.erase(0, 2);
            }
            identifier = std::stol(temporaryIdentifier);
        }
        catch (const std::exception &e)
        {
            throw std::invalid_argument("Could not convert "
                                      + eventIdentifier + " to an integer");
        }
    }
    if (identifier < 0)
    {
        throw std::invalid_argument("Could not convert "
                                  + eventIdentifier + " to an integer");
    }
    return getPreferredOriginIdentifier(identifier);
  
}

int64_t AQMSPostgresHandler::getPreferredOriginIdentifier(
    const int64_t eventIdentifier) const
{
    int64_t originIdentifier{-1};
    std::string query{
R"'''(
SELECT prefor FROM event WHERE evid=:identifier LIMIT 1;
)'''"
    };

    return originIdentifier;
}

/// Destructor
AQMSPostgresHandler::~AQMSPostgresHandler() = default;
