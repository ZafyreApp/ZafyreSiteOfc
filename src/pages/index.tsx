import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Zafyre</title>
      </Head>
      <main className="bg-zinc-900 text-white min-h-screen flex flex-col items-center justify-center">
        <img src="/logo.png" alt="Zafyre Logo" className="w-32 mb-6" />
        <div className="space-x-4">
          <Link href="/login">
            <button className="bg-yellow-500 px-6 py-2 rounded text-black font-bold">Entrar</button>
          </Link>
          <Link href="/signup">
            <button className="bg-yellow-700 px-6 py-2 rounded text-white font-bold">Criar Conta</button>
          </Link>
        </div>
      </main>
    </>
  );
}
