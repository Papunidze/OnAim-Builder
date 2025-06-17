import { lazy, Suspense, type JSX } from "react";

const Builder = lazy(() => import("@app-features/builder"));

const App = (): JSX.Element => {
  return (
    <main className="app">
      <Suspense fallback={<div>Loading builder...</div>}>
        <Builder />
      </Suspense>
    </main>
  );
};

export default App;
