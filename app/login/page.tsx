// import { useState } from 'react';
import {
  // login, signup,
  signInWithEmail,
} from './actions';

export default function LoginPage() {
  // const [isServ, setIsServer] = useState(false);
  // console.log({ isServ });
  return (
    <form>
      <label htmlFor='email'>Email:</label>
      <input id='email' name='email' type='email' required />
      {/* <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button
      className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
      formAction={login}>Log in</button>
      <button
      className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
      formAction={signup}>Sign up</button> */}
      <button
        className='rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]'
        formAction={signInWithEmail}
      >
        MAGIC LINK
      </button>
    </form>
  );
}
