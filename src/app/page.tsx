'use client';

import App from './app';

export default function Home() {
  // const handleClick = async () => {
  //   try {
  //     const response = await fetch('/api/echo')
  //     const data = await response.json()
  //     alert(data.message)
  //   } catch (error) {
  //     console.error('Error fetching echo:', error)
  //     alert('Failed to fetch echo')
  //   }
  // }

  return (
    <main className="min-h-screen w-full">
      <App />
    </main>
  );
}
