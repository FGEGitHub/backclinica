import jwt from "jsonwebtoken";

// =====================================================
// VERIFICAR TOKEN JWT
// =====================================================

function verifyToken(req) {
    const authorization = req.get("authorization");

    // Verificar que exista el header Authorization
    // y que utilice el formato Bearer
    if (!authorization || !authorization.startsWith("Bearer ")) {
        return null;
    }

    // Obtener solamente el token
    const token = authorization.substring(7);

    try {
        // Verificar el token utilizando la clave del .env
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}


// =====================================================
// MIDDLEWARE - USUARIO AUTENTICADO
// =====================================================

export function isLoggedInn(req, res, next) {

    const decodedToken = verifyToken(req);

    if (!decodedToken?.id) {
        return res.status(401).json({
            message: "No autorizado"
        });
    }

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


// =====================================================
// MIDDLEWARE - NIVELES 2, 3 Y 4
// =====================================================

export function isLoggedInn4(req, res, next) {

    const decodedToken = verifyToken(req);

    if (
        !decodedToken?.id ||
        ![2, 3, 4].includes(decodedToken.nivel)
    ) {
        return res.status(401).json({
            message: "No autorizado"
        });
    }

    next();
}


// =====================================================
// MIDDLEWARE - NIVEL 5
// =====================================================

export function isLoggedInn5(req, res, next) {

    const decodedToken = verifyToken(req);

    if (!decodedToken?.id || decodedToken.nivel !== 5) {
        return res.status(401).json({
            message: "No autorizado"
        });
    }

    next();
}


// =====================================================
// MIDDLEWARE - CLIENTE AUTENTICADO
// =====================================================

export function isLoggedInncli(req, res, next) {

    const decodedToken = verifyToken(req);

    if (!decodedToken?.id) {
        return res.status(401).json({
            message: "No autorizado"
        });
    }

    next();
}


// =====================================================
// PASSPORT - SESIONES
// =====================================================

export function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }

    return res.redirect("/signin");
}


export function isNotLoggedIn(req, res, next) {

    if (!req.isAuthenticated()) {
        return next();
    }

    return res.redirect("/profile");
}