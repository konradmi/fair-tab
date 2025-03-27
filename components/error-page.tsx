import { Link } from "react-router-dom";

export const ErrorPage = () => (
  <div className="container mx-auto px-4 py-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
    <p className="text-muted-foreground mb-4">We couldn&apos;t load this page.</p>
    <Link to="/" className="text-blue-500 hover:underline">Go back to home</Link>
  </div>
);

ErrorPage.displayName = "ErrorPage";

export default ErrorPage; 
