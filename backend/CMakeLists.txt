cmake_minimum_required(VERSION 3.20)
project(CCTReviewService VERSION 0.1.0 LANGUAGES CXX)
enable_testing()

option(ENABLE_SSL "Enable SSL connections" ON) 
option(WITH_CORS "Compile with CORS *" OFF)
#cmake -DBUILD_SHARED_LIBS=YES /path/to/source
set(BUILD_SHARED_LIBS YES)

include(CheckCXXCompilerFlag)
set(CMAKE_CXX_STANDARD 20) 
set(CMAKE_CXX_STANDARD_REQUIRED ON) 

list(APPEND CMAKE_MODULE_PATH ${CMAKE_SOURCE_DIR}/cmake)

set(THREADS_PREFER_PTHREAD_FLAG ON) 
find_package(SOCI COMPONENTS postgresql sqlite3 REQUIRED)
find_package(spdlog REQUIRED)
find_package(nlohmann_json 3.2.0 REQUIRED)
find_package(Boost COMPONENTS program_options date_time REQUIRED)
find_package(jwt-cpp 0.7.0...2.0 REQUIRED)
find_package(PostgreSQL REQUIRED)
find_package(OpenLdap REQUIRED)
find_package(Catch2 3)
find_package(ZLIB)
if (${ENABLE_SSL})
   find_package(OpenSSL COMPONENTS SSL Crypto REQUIRED)
else()
   find_package(OpenSSL COMPONENTS SSL Crypto)
endif()
if (${OPENSSL_FOUND})
   message("Found SSL version ${OPENSSL_VERSION}")
endif()


add_executable(cctReviewService
               src/main.cpp
               src/ldap.cpp
               src/listener.cpp
               src/callback.cpp
               src/authenticator.cpp
               src/permissions.cpp
               src/postgresql.cpp
               src/cctPostgresService.cpp)

target_link_libraries(cctReviewService
                      PRIVATE SOCI::soci_postgresql SOCI::soci_sqlite3
                              #OpenSSL::SSL OpenSSL::Crypto ZLIB::ZLIB
                              Boost::program_options
                              spdlog::spdlog
                              nlohmann_json::nlohmann_json
                              jwt-cpp::jwt-cpp
                              ${LDAP_LIBRARY} ${LBER_LIBRARY})
target_include_directories(cctReviewService
                           PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src
                                   ${PostgreSQL_INCLUDE_DIRS}
                                   ${OPENLDAP_INCLUDE_DIR}
                                   Boost::headers)
set_target_properties(cctReviewService PROPERTIES
                      CXX_STANDARD 20
                      CXX_STANDARD_REQUIRED YES 
                      CXX_EXTENSIONS NO) 
if (${WITH_CORS})
   target_compile_definitions(cctReviewService PUBLIC ENABLE_CORS)
endif()
if (${ENABLE_SSL})
   target_compile_definitions(cctReviewService PUBLIC WITH_OPENSSL)
   target_link_libraries(cctReviewService PRIVATE OpenSSL::SSL OpenSSL::Crypto)
endif()
if (${ZLIB_FOUND})
   target_link_libraries(cctReviewService PRIVATE ${ZLIB_LIBRARIES})
   target_include_directories(cctReviewService PRIVATE ${ZLIB_INCLUDE_DIRS})
endif()

##########################################################################################
#                                      Installation                                      #
##########################################################################################
include(GNUInstallDirs)
include(CMakePackageConfigHelpers)
#configure_package_config_file(
#    cmake/${PROJECT_NAME}.cmake.in "${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}Config.cmake"
#    INSTALL_DESTINATION "${CMAKE_INSTALL_LIBDIR}/cmake/${PROJECT_NAME}")
#write_basic_package_version_file(
#    "${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}ConfigVersion.cmake"
#    VERSION "${version}"
#    COMPATIBILITY AnyNewerVersion
#)
install(TARGETS cctReviewService
        EXPORT ${PROJECT_NAME}-targets
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
        LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
        ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
        PUBLIC_HEADER DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
        COMPONENT Runtime)
#install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/include/cctReviewService
#        DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})
export(EXPORT ${PROJECT_NAME}-targets
       FILE "${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}Targets.cmake")
install(EXPORT ${PROJECT_NAME}-targets
        FILE ${PROJECT_NAME}Targets.cmake
        DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/${PROJECT_NAME})
#install(FILES
#        ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}Config.cmake
#        ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}ConfigVersion.cmake
#        DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/${PROJECT_NAME})

##########################################################################################
#                                     CPACK Packaging                                    #
##########################################################################################
set(CPACK_PACKAGE_NAME ${PROJECT_NAME})
set(CPACK_PACKAGE_VENDOR "UUSS")
set(CPACK_PACKAGE_CONTACT "ben.baker@utah.edu")
set(CPACK_PACKAGE_LICENSE "MIT")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "The backend REST API for reviewing Mw,coda magnitudes.")
set(CPACK_PACKAGE_INSTALL_DIRECTORY ${CPACK_PACKAGE_NAME})
set(CPACK_VERBATIM_VARIABLES YES)
set(CPACK_PACKAGE_VERSION_MAJOR ${PROJECT_VERSION_MAJOR})
set(CPACK_PACKAGE_VERSION_MINOR ${PROJECT_VERSION_MINOR})
set(CPACK_PACKAGE_VERSION_PATCH ${PROJECT_VERSION_PATCH})
set(CPACK_RESOURCE_FILE_LICENSE "${CMAKE_CURRENT_SOURCE_DIR}/../LICENSE")
set(CPACK_COMPONENTS_ALL executables)
if (WIN32)
    set(CPACK_GENERATOR ZIP WIX)
elseif (APPLE)
    set(CPACK_GENERATOR TGZ productbuild)
elseif(CMAKE_SYSTEM_NAME STREQUAL "Linux")
    set(CPACK_GENERATOR TGZ RPM)
else()
    set(CPACK_GENERATOR TGZ)
endif()
set(CPACK_SOURCE_IGNORE_FILES
  /\\.git/
  \\.swp
  \\.orig
  /CMakeLists\\.txt\\.user
  /private/
)
include(CPack) # Put this last!

