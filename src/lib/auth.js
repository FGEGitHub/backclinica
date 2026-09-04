import jwt from "jsonwebtoken";

// =====================================================
// VERIFICAR TOKEN JWT
// =====================================================

function verifyToken(req) {
    const authorization = req.get("authorization");

    // Verificar que exista el header Authorization
    // y que utilice el formato Bearer
    if (!authorization || !authorization.startsWith("Bearer ")) {
        console.log("No autorizado: Header Authorization no presente o formato incorrecto");
        return null;
    }

    // Obtener solamente el token
    const token = authorization.substring(7);

    try {
        // Verificar el token utilizando la clave del .env
        console.log(jwt.verify(token, process.env.JWT_SECRET));
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.log("Error al verificar el token:", error);
        return null;
    }
}


// =====================================================
// MIDDLEWARE - USUARIO AUTENTICADO
// =====================================================

export function isLoggedInncli(req, res, next) {

    const decodedToken = verifyToken(req);
console.log(decodedToken)
    if (!decodedToken?.id) {
        return res.status(401).json({
            message: "No autorizado"
        });
    }
console.log(decodedToken)
    next();
}


// =====================================================
// MIDDLEWARE - NIVEL 2
// =====================================================

export function isLoggedInn2(req, res, next) {

    const decodedToken = verifyToken(req);

    if (!decodedToken?.id || decodedToken.nivel !== 2) {
        return res.status(401).json({
            message: "No autorizado"
        });
    }

    next();
}
