import jwt from 'jsonwebtoken';

const config = {
    secret: "bezkoder-secret-key"
};

export const verifyToken = (req: any, res: any, next: any) => {
    let token = req.session.token;
    if (!token) {
        return res.redirect('/login');
    }
    jwt.verify(token, config.secret, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
      req.userId = decoded.id;
      next();
    });
};