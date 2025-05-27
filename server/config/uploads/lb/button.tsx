import { JSX, useState } from "react";

const Button = (): JSX.Element => {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((prev) => prev + 1)}>Button {count}</button>
  );
};

export default Button;
