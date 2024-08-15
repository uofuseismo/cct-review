#ifndef CCT_SERVICE_LISTENER_HPP
#define CCT_SERVICE_LISTENER_HPP 
#include <string>
#include <memory>
#include <functional>
#include <boost/asio.hpp>
#include <boost/beast/ssl.hpp>
#include <boost/beast/http/message.hpp>
#include <boost/beast/http/verb.hpp>
namespace CCTService
{
class Listener : public std::enable_shared_from_this<Listener>
{
public:
    /// @brief Constructor
    Listener(boost::asio::io_context& ioContext,
             boost::asio::ssl::context &sslContext,
             boost::asio::ip::tcp::endpoint endpoint,
             const std::shared_ptr<const std::string> &documentRoot,
             const std::function
             <
                std::string (const boost::beast::http::header
                             <
                                 true,
                                 boost::beast::http::basic_fields<std::allocator<char>>
                             > &,
                             const std::string &,
                             const boost::beast::http::verb)
             > &callback);
    /// @brief Begin accepting incoming connections.
    void run();
private:
    void doAccept();
    void onAccept(boost::beast::error_code errorCode,
                  boost::asio::ip::tcp::socket socket);

    boost::asio::io_context &mIOContext;
    boost::asio::ssl::context &mSSLContext;
    boost::asio::ip::tcp::acceptor mAcceptor;
    std::shared_ptr<const std::string> mDocumentRoot;
    std::function<std::string (const boost::beast::http::header
                               <
                                  true,
                                  boost::beast::http::basic_fields<std::allocator<char>>
                               > &,
                               const std::string &,
                               const boost::beast::http::verb)> mCallback;
};
}
#endif
