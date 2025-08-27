"""
Arquivo WSGI para deploy em produção
"""
import os
from chat.app import create_app

# Configura o ambiente
os.environ.setdefault('FLASK_ENV', 'production')

# Cria a aplicação
app = create_app()

if __name__ == '__main__':
    app.run()

