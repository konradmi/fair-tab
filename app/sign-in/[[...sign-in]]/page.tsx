import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">FairTab</h1>
          <p className="text-gray-600 mt-2">Sign in to manage and split expenses with friends</p>
        </div>
        <SignIn appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl rounded-xl border border-gray-100",
          }
        }} />
      </div>
    </div>
  );
} 
