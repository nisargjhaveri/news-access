import sys
from SimpleXMLRPCServer import SimpleXMLRPCServer

import nltk

server = SimpleXMLRPCServer(("localhost", 0))
print 'LOCATION:',\
    'http://' + ':'.join(map(str, server.socket.getsockname())) + '/'
sys.stdout.flush()

server.register_introspection_functions()

# ------------------------------------------- #
# ------ Remotely available functions ------- #
# ------------------------------------------- #

# Sentence tokenizer
server.register_function(nltk.sent_tokenize)

# ------------------------------------------- #

server.serve_forever()
