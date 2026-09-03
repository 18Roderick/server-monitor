# Ping Server

Una aplicación para ver el estado de su página web.

## Descripción

Ping Server es una herramienta diseñada para monitorear el estado de cualquier página web. Utilizando esta aplicación, puede verificar si su sitio web está en línea y funcionando correctamente.

## Características

- Monitoreo de uptime
- Alertas en tiempo real
- Informes detallados
- Fácil de usar

## Tecnologías Utilizadas

- **TypeScript**: 95.5%
- **Dockerfile**: 3.5%
- **JavaScript**: 1%

## Instalación

### Prerrequisitos

- Node.js
- Docker

### Pasos

1. Clone el repositorio:
    ```sh
    git clone https://github.com/18Roderick/ping-server.git
    ```

2. Instale las dependencias:
    ```sh
    cd ping-server
    npm install
    ```

3. Inicie la aplicación:
    ```sh
    npm start
    ```

## Uso

Una vez que la aplicación esté en funcionamiento, puede acceder a la interfaz de usuario para agregar las URLs que desea monitorear.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, siga los siguientes pasos:

1. Fork el repositorio
2. Cree una nueva rama (`git checkout -b feature/nueva-caracteristica`)
3. Realice sus cambios y haga commits (`git commit -m 'Agregar nueva característica'`)
4. Envíe sus cambios (`git push origin feature/nueva-caracteristica`)
5. Abra un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulte el archivo [LICENSE](LICENSE) para obtener más detalles.

## Contacto

Para cualquier pregunta o sugerencia, por favor contacte a:
- [18Roderick](https://github.com/18Roderick)

### Pending todo parts of the application

- Authentication
  - TOKEN (done)
  - Refresh token
- Users
  - Update
  - Delete
  - Create
  - Select
- Servers
  - Create (done)
  - Update (done)
  - Delete (done)
  - Select (done)
- Tasks
  - Add run pings and create the logs for the database
  - Delete tasks
- Dashboards
  - Realtime data of the pings
  - Graph of the up/down times of the server across the time
