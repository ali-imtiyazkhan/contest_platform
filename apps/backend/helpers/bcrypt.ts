import bcrypt from "bcrypt";


// hash password
const hash = (password: string) => {
  const hashed = bcrypt.hash(password, 10);

  return hashed;
};

// compare password
const compare = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export { hash, compare };
