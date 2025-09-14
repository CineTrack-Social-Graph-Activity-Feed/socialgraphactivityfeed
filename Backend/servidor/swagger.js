import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger.json';
const endPointFiles = ['./server.js'];

const doc = {
    info: {
        title: 'API de Social Graph Activity Feed',
        description: 'API para módulo de feed de actividad social estilo Letterboxd, desarrollado con Node.js, Express y MongoDB. Permite a los usuarios seguirse entre sí, comentar, dar likes y ver las actividades de sus seguidores',
    },
    host: 'localhost:3000',
    schemes: ['http'],
}

swaggerAutogen()(outputFile, endPointFiles, doc);
