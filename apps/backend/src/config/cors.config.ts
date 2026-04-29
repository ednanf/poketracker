// This file configures CORS options for the application.
// It allows requests from specific origins and defines allowed HTTP methods.
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://10.0.0.102:4173',
    'http://10.0.0.102:5173',
];

const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    optionsSuccessStatus: 200, // For legacy browser support
};

export default corsOptions;
