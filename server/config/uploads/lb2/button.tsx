import React, { JSX, useState } from "react";

const Button = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((prev) => prev + 1)}>
      {children} {count}
    </button>
  );
};

export default Button;
