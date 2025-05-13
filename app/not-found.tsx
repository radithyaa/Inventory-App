import { Button } from '@/components/ui/button'
import Footer from '@/components/ui/footer'
import Link from 'next/link'
import React from 'react'

function NotFound() {
  return (
    <div className=''>
      <section className='h-[75vh] flex flex-col items-center justify-center'>
        <h1 className='text-3xl mb-4'>404</h1>
        <p>The page you are looking for does not exist.</p>
        <Button variant='outline' className='mt-2' asChild><Link href='/'>Go Home</Link></Button>
      </section>
      <div className='max-h-[20vh]'>
        <Footer />
      </div>
    </div>
  )
}

export default NotFound
