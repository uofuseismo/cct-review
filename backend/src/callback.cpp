#include <string>
#include <map>
#include <iostream>
#include <functional>
#include <boost/algorithm/string.hpp>
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>
#include "cctPostgresService.hpp"
#include "callback.hpp"
#include "permissions.hpp"
#include "events.hpp"
#include "exceptions.hpp"
#include "authenticator.hpp"
#include "aqms.hpp"
#include "base64.hpp"

using namespace CCTService;

class Callback::CallbackImpl
{
public:
    /// @brief Authenticates the user with the given user name and
    ///        password stored in a base64 representation.  
    /// @result The response to propagate back to the client and
    ///         the user's credentials.
    /// @throws InvalidPermissionException if the user cannot be authenticated.
    [[nodiscard]] std::pair<nlohmann::json, IAuthenticator::Credentials>
        authenticate(const std::string &userNameAndPasswordHex) const
    {
        nlohmann::json jsonResponse; 
        IAuthenticator::Credentials credentials;
        auto authorizationValue
            = base64::from_base64(userNameAndPasswordHex);
        auto splitIndex = authorizationValue.find(":");
        if (splitIndex != authorizationValue.npos)
        {
            std::string userName
                = authorizationValue.substr(0, splitIndex);
            std::string password;
            if (splitIndex < authorizationValue.length() - 1)
            {
                 password
                     = authorizationValue.substr(splitIndex + 1,
                                                 authorizationValue.length());
            }
            if (!mAuthenticator->authenticate(userName, password))
            {
                throw InvalidPermissionException("Could not authenticate "
                                               + userName);
            }

            spdlog::debug("Sending authentication response...");
            auto tempCredentials = mAuthenticator->getCredentials(userName); 
            if (tempCredentials)
            {
                credentials = std::move(*tempCredentials);
                jsonResponse["status"] = "success";
                jsonResponse["jsonWebToken"] = credentials.token;
                jsonResponse["permissions"]
                    = CCTService::permissionsToString(credentials.permissions);
            }
            else
            {
                spdlog::warn("Somehow failed to return credentials");
                throw std::runtime_error("Internal error");
            }
        }
        else
        {
            throw BadRequestException(
               "Basic authorization field could not be parsed");
        }
        return std::pair {jsonResponse, credentials};
    }
    /// @brief Authorizes a user given with the provided JWT.
    /// @param[in] jsonWebToken  The JSON web token.
    /// @result The user's credentials.
    /// @throws InvalidPermissionException if the user is not authorized.
    [[nodiscard]] IAuthenticator::Credentials 
        authorize(const std::string jsonWebToken) const
    {
        IAuthenticator::Credentials credentials;
        spdlog::debug("Created: " + jsonWebToken);
        try
        {
             credentials = mAuthenticator->authorize(jsonWebToken);
             spdlog::debug("Callback authorized " + credentials.user);
        }
        catch (const std::exception &e)
        {
             spdlog::debug("Could not authenticated bearer token: "
                         + std::string {e.what()});
             throw InvalidPermissionException(
                 "Could not authorize bearer token");
        }
        return credentials;
    }
///private:
    std::function<std::string (const boost::beast::http::header
                               <
                                   true,
                                   boost::beast::http::basic_fields<std::allocator<char>>
                               > &,
                               const std::string &,
                               const boost::beast::http::verb)> mCallbackFunction;
    std::shared_ptr<CCTPostgresService> mCCTPostgresService{nullptr};
    std::shared_ptr<CCTService::IAuthenticator> mAuthenticator{nullptr};
};

/// @brief Constructor.
Callback::Callback(std::shared_ptr<CCTPostgresService> &cctEventsService,
                   std::shared_ptr<CCTService::IAuthenticator> authenticator) :
    pImpl(std::make_unique<CallbackImpl> ())
{
    if (cctEventsService == nullptr)
    {
        throw std::invalid_argument("CCT events service is NULL");
    }
    if (!cctEventsService->isRunning())
    {
        throw std::runtime_error("CCT event service is not running");
    }
    if (authenticator == nullptr)
    {
        throw std::invalid_argument("Authenticator is NULL");
    }
    pImpl->mCallbackFunction
        = std::bind(&Callback::operator(),
                    this,
                    std::placeholders::_1,
                    std::placeholders::_2,
                    std::placeholders::_3);
    pImpl->mCCTPostgresService = cctEventsService;
    pImpl->mAuthenticator = authenticator;
}

/// @brief Destructor.
Callback::~Callback() = default;

/// @brief Actually processes the requests.
std::string Callback::operator()(
    const boost::beast::http::header
    <
        true,
        boost::beast::http::basic_fields<std::allocator<char>>
    > &requestHeader,
    const std::string &message,
    const boost::beast::http::verb httpRequestType) const
{
    // First thing is we authenticate/authorize the user
    IAuthenticator::Credentials credentials;
    auto authorizationIndex = requestHeader.find("Authorization");
    if (authorizationIndex != requestHeader.end())
    {
        std::vector<std::string> authorizationField;
        boost::split(authorizationField,
                     requestHeader["Authorization"],
                     boost::is_any_of(" \t\n"));
        if (authorizationField.size() < 2)
        {
            throw BadRequestException("Authorization field incorrect size");
        }
        if (authorizationField.at(0) == "Basic")
        {
            spdlog::debug("Basic authentication");
            auto [jsonResponse, temporaryCredentials] 
                = pImpl->authenticate(authorizationField.at(1));
            return jsonResponse.dump();
        }
        else if (authorizationField.at(0) == "Bearer")
        {
            spdlog::debug("Bearer authorization");
            credentials = pImpl->authorize(authorizationField.at(1));
        }
        else
        {
            throw UnimplementedException("Unhandled authorization type: "
                                       + authorizationField.at(0));
        }
    }
    else
    {
        throw BadRequestException("Authorization header field not defined");
    }
    // If the credentials are insufficient then we're out of here
    if (credentials.permissions == Permissions::None)
    {
        throw InvalidPermissionException(
            "Insufficient permissions to make request");
    }
    if (credentials.permissions == Permissions::ReadOnly &&
        (httpRequestType != boost::beast::http::verb::put ||
         httpRequestType != boost::beast::http::verb::post))
    {
        throw InvalidPermissionException(
            "Insufficient permissions to put/post");
    }

    // I only know how to handle these types of requests
    if (httpRequestType != boost::beast::http::verb::get &&
        httpRequestType != boost::beast::http::verb::put &&
        httpRequestType != boost::beast::http::verb::post)
    {   
        throw std::runtime_error("Unhandled http request verb");
    }

    // We're to the message part -> is the parsable?
    if (message.empty())
    {
        throw BadRequestException("Empty request");
    }
    nlohmann::json result;
    nlohmann::json object;
    try
    {
        object = nlohmann::json::parse(message);
    }   
    catch (const std::exception &e)
    {
        throw std::runtime_error("Could not parse JSON request");
    }
    if (!object.contains("request_type"))
    {
        throw BadRequestException("request_type not set in JSON request");
    }
    auto requestType = object["request_type"].template get<std::string> ();
    spdlog::info("Received request type " + requestType
               + " from " + credentials.user);
    // Schema requests
    if (requestType == "availableSchemas")
    {
        nlohmann::json result;
        result["status"] = "success";
        result["request"] = requestType;
        result["availableSchemas"] = pImpl->mCCTPostgresService->getSchemas();
        return result.dump();
    }

    // Lightweight CCT data
    if (requestType == "hash")
    {
        if (!object.contains("schema"))
        {
            throw BadRequestException("schema not set in JSON request");
        }
        auto schema = object["schema"].template get<std::string> (); 
        if (!pImpl->mCCTPostgresService->haveSchema(schema))
        {
            throw BadRequestException("Invalid schema: " + schema);
        }
        auto hash = pImpl->mCCTPostgresService->getCurrentHash(schema);
        nlohmann::json result;
        result["status"] = "success";
        result["request"] = requestType;
        result["hash"] = hash;
        return result.dump();
    }
    else if (requestType == "cctData")
    {
        if (!object.contains("schema"))
        {
            throw BadRequestException("schema not set in JSON request");
        }
        spdlog::debug("Performing lightweight data request for "
                    + credentials.user);
        auto schema = object["schema"].template get<std::string> ();
        if (!pImpl->mCCTPostgresService->haveSchema(schema))
        {
            spdlog::error(schema + " does not exist");
            throw BadRequestException("Invalid schema: " + schema);
        }
        nlohmann::json result;
        std::string cctData
            = pImpl->mCCTPostgresService->lightWeightDataToString(schema, -1); 
        //std::cout << cctData << std::endl;
        result["status"] = "success";
        result["request"] = requestType;
        result["events"] = std::move(cctData);
        return result.dump();
    }
    else if (requestType == "eventData")
    {
        if (!object.contains("schema"))
        {
            throw BadRequestException("schema not set in JSON request");
        }
        if (!object.contains("eventIdentifier"))
        {
            throw BadRequestException(
                "eventIdentifier not set in JSON request");
        }
        spdlog::debug("Performing heavyweight data request for "
                    + credentials.user);
        auto eventIdentifier
            = object["eventIdentifier"].template get<std::string> ();
        if (eventIdentifier.empty())
        {
            throw BadRequestException("Event identifier is empty");
        }
        auto schema = object["schema"].template get<std::string> (); 
        if (!pImpl->mCCTPostgresService->haveSchema(schema))
        {
            throw BadRequestException("Invalid schema: " + schema);
        }
        nlohmann::json result;
        std::string eventData;
        try
        {
            eventData
               = pImpl->mCCTPostgresService->heavyWeightDataToString(
                     schema, eventIdentifier, -1);
        }
        catch (const std::exception &e)
        {
            throw BadRequestException("Invalid event identifier: "
                                    + eventIdentifier); 
        }
        result["status"] = "success";
        result["request"] = requestType;
        result["eventIdentifier"] = eventIdentifier;
        result["data"] = std::move(eventData);
        return result.dump();
    }
    else if (requestType == "accept")
    {
        if (!object.contains("schema"))
        {
            throw BadRequestException("schema not set in JSON request");
        }
        if (!object.contains("eventIdentifier"))
        {
            throw BadRequestException(
                "eventIdentifier not set in JSON request");
        }
        spdlog::debug("Performing accept for request for "
                    + credentials.user);
        auto eventIdentifier
            = object["eventIdentifier"].template get<std::string> (); 
        if (eventIdentifier.empty())
        {
            throw BadRequestException("Event identifier is empty");
        }
        auto schema = object["schema"].template get<std::string> (); 
        if (!pImpl->mCCTPostgresService->haveSchema(schema))
        {
            throw BadRequestException("Invalid schema: " + schema);
        }
        std::string status{"failure"};
        std::string reason;
        if (!pImpl->mCCTPostgresService->haveEvent(schema, eventIdentifier))
        {
            reason = eventIdentifier + " does not exist";
            spdlog::error(reason);
        }
        else
        {
            spdlog::info("Accepting magnitude for " + eventIdentifier
                       + " on " + schema + " schema");
            try
            {
if (schema == "test")
{
                pImpl->mCCTPostgresService->acceptEvent(schema, eventIdentifier);
                status = "success";
}
else
{
 spdlog::critical("update for prod");
}
                status = "success"; 
            }
            catch (const std::exception &error)
            {
                spdlog::warn("Failed to accept event " + eventIdentifier
                           + " because " + error.what());
                reason = "Server error";
                status = "failure";
            }
        }
        nlohmann::json result;
        result["status"] = status;
        result["request"] = requestType;
        result["eventIdentifier"] = eventIdentifier;
        if (!reason.empty()){result["reason"] = reason;}
        return result.dump();
    }
    else if (requestType == "reject")
    {
        if (!object.contains("schema"))
        {
            throw BadRequestException("schema not set in JSON request");
        }
        if (!object.contains("eventIdentifier"))
        {
            throw BadRequestException(
                "eventIdentifier not set in JSON request");
        }
        spdlog::debug("Performing reject request for "
                    + credentials.user);
        auto eventIdentifier
            = object["eventIdentifier"].template get<std::string> (); 
        if (eventIdentifier.empty())
        {
            throw BadRequestException("Event identifier is empty");
        }
        auto schema = object["schema"].template get<std::string> (); 
        if (!pImpl->mCCTPostgresService->haveSchema(schema))
        {
            throw BadRequestException("Invalid schema: " + schema);
        }
        std::string status{"failure"};
        std::string reason;
        if (!pImpl->mCCTPostgresService->haveEvent(schema, eventIdentifier))
        {
            reason = eventIdentifier + " does not exist";
            spdlog::error(reason);
        }
        else
        {
            spdlog::info("Rejecting magnitude for " + eventIdentifier
                       + " in schema " + schema);
            try
            {
if (schema == "test")
{
                pImpl->mCCTPostgresService->rejectEvent(schema, eventIdentifier);
                status = "success";
}
else
{
 spdlog::critical("update reject for prod");
status = "success";
}
            }
            catch (const std::exception &error)
            {
                spdlog::warn("Failed to reject event " + eventIdentifier
                           + " because " + error.what());
                reason = "Server error";
                status = "failure";
            }
            status = "success";
        }   
        nlohmann::json result;
        result["status"] = status;
        result["request"] = requestType;
        result["eventIdentifier"] = eventIdentifier;
        if (!reason.empty()){result["reason"] = reason;}
        return result.dump();
    }
    throw BadRequestException("Unhandled request type: " + requestType);
}

/// @result A function pointer to the callback.
std::function<
    std::string (
        const boost::beast::http::header<
            true,
            boost::beast::http::basic_fields<std::allocator<char>> 
        > &,
        const std::string &,
        const boost::beast::http::verb
    )>
Callback::getCallbackFunction() const noexcept
{
    return pImpl->mCallbackFunction;
}
