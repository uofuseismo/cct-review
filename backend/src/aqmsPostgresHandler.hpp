#ifndef CCT_BACKEND_SERVICE_DATABASE_AQMS_POSTGRES_HANDLER_HPP
#define CCT_BACKEND_SERVICE_DATABASE_AQMS_POSTGRES_HANDLER_HPP
#include <memory>
namespace CCTService
{
 class PostgreSQL;
}
namespace CCTService
{
/// @name AQMSPostgresHandler "aqmsPostgreHandler.hpp" "aqmsPostgresHandler.hpp"
/// @brief Defines the interactivity with the AQMS PostgreSQL database.
/// @copyright Ben Baker (University of Utah) distributed under the MIT license. 
class AQMSPostgresHandler
{
public:
    /// @name Constructors
    /// @{

    /// @brief Constructor.
    AQMSPostgresHandler() = delete;
    /// @brief Creates the postgres service that queries the given schemas
    ///        from the given database connection.
    explicit AQMSPostgresHandler(std::unique_ptr<PostgreSQL> &&connection);
    /// @}

    [[nodiscard]] int64_t getPreferredOriginIdentifier(const std::string &eventIdentifier) const;
    [[nodiscard]] int64_t getPreferredOriginIdentifier(int64_t eventIdentifier) const;
    /// @name Destructors
    /// @{

    /// @brief Destructor.
    ~AQMSPostgresHandler();
    /// @}
private:
    class AQMSPostgresHandlerImpl;
    std::unique_ptr<AQMSPostgresHandlerImpl> pImpl;
};
}
#endif
