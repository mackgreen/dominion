#!/usr/bin/python

import sys
import random
import glob

from twisted.web.static import File
from twisted.python import log
from twisted.web.server import Site
from twisted.internet import reactor

from autobahn.twisted.websocket import WebSocketServerFactory, \
    WebSocketServerProtocol

from autobahn.twisted.resource import WebSocketResource


class SomeServerProtocol(WebSocketServerProtocol):
    def onOpen(self):
        """
        Connection from client is opened. Fires after opening
        websockets handshake has been completed and we can send
        and receive messages.

        Register client in factory, so that it is able to track it.
        Try to find conversation partner for this client.
        """
        self.factory.register(self)

    def connectionLost(self, reason):
        """
        Client lost connection, either disconnected or some error.
        Remove client from list of tracked connections.
        """
        self.factory.unregister(self)

    def onMessage(self, payload, isBinary):
        """
        Message sent from client, communicate this message to its conversation partner,
        """
        self.factory.communicate(self, payload, isBinary)



class DominionAppFactory(WebSocketServerFactory):
    def __init__(self, *args, **kwargs):
        super(DominionAppFactory, self).__init__(*args, **kwargs)
        self.clients = {}

    def register(self, client):
        """
        Add client to list of managed connections.
        """
        self.clients[client.peer] = {"object": client, "partner": None}
        xmls = glob.glob("xml/*.xml")
        self.clients[client.peer]["object"].sendMessage("loadXmlFiles=" + ",".join(xmls))

    def unregister(self, client):
        """
        Remove client from list of managed connections.
        """
        self.clients.pop(client.peer)

    def communicate(self, client, payload, isBinary):
        log.msg(payload)
        if ( payload.find("setUserName") != -1 ):
          split = payload.split("=")
          self.clients[client.peer]["username"] = split[1]
          self.clients[client.peer]["object"].sendMessage(payload)
          return
        if ( payload.find("startGame") != -1 ):
          payload = payload + ":"
          for key, value in self.clients.iteritems():
            if ( "username" in value ):
              payload = payload + value["username"] + ","
            else:
              self.clients[client.peer]["object"].sendMessage("error=Not all players have set their user name");
              return
          for key, value in self.clients.iteritems():
            value["object"].sendMessage(payload[:-1])
          return
        for key, value in self.clients.iteritems():
          value["object"].sendMessage(payload)

if __name__ == "__main__":
    log.startLogging(sys.stdout)

    # static file server seving index.html as root
    root = File(".")

    factory = DominionAppFactory(u"ws://127.0.0.1:8080")
    factory.protocol = SomeServerProtocol
    resource = WebSocketResource(factory)
    # websockets resource on "/ws" path
    root.putChild(u"ws", resource)

    site = Site(root)
    reactor.listenTCP(8080, site)
    reactor.run()