import jwt from "jsonwebtoken";

// =======================
// Helper para verificar token
// =======================
function verifyToken(req, secret) {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.substring(7);

  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}


export const verifyTokenclin = (req, secret) => {
  const authorization = req.get('authorization')

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    const token = authorization.substring(7)

    try {
      return jwt.verify(token, secret)
    } catch (error) {
      return null
    }
  }

  return null
}


// =======================
// Middlewares
// =======================
export function isLoggedInn(req, res, next) {
  const decodedToken = verifyToken(req, "fideicomisocs121");

  if (!decodedToken?.id) {
    return res.status(401).send("error login");
  }

  next();
}

export function isLoggedInn2(req, res, next) {
  const decodedToken = verifyToken(req, "fideicomisocs121");

  if (!decodedToken?.id || decodedToken.nivel !== 2) {
    return res.status(401).send("error login");
  }

  next();
}

export function isLoggedInn4(req, res, next) {
  const decodedToken = verifyToken(req, "fideicomisocs121");

  if (
    !decodedToken?.id ||
    ![2, 3, 4].includes(decodedToken.nivel)
  ) {
    return res.status(401).send("error login");
  }

  next();
}

export function isLoggedInn5(req, res, next) {
  const decodedToken = verifyToken(req, "fideicomisocs121");

  if (!decodedToken?.id || decodedToken.nivel !== 5) {
    return res.status(401).send("error login");
  }

  next();
}

export function isLoggedInncli(req, res, next) {
  const decodedToken = verifyTokenclin(req, "clin123")

  console.log(decodedToken)

  if (!decodedToken?.id) {
    return res.status(401).send("error login")
  }

  next()
}

// =======================
// Passport
// =======================
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
