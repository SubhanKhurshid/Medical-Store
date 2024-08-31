import Link from 'next/link'
import React from 'react'

const AddOpeationsPage = () => {
  return (
    <div className='flex flex-col items-center justify-center mt-32 gap-10'>
       <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-3xl md:text-5xl max-w-3xl font-bold tracking-tighter px-10 text-center">
            Perform your add operations
          </h1>

          <h1 className='text-center'>Select the operation you want to perform</h1>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center justify-center md:gap-3">
          <Link href={"/signup"}>
            <div className="bg-blue-950  font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80 hover:bg-blue-950 rounded-md">
              <h1>ADD DOCTOR</h1>
            </div>
          </Link>
          <Link href={"/signup"}>
            <div className="bg-blue-950 font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80  hover:bg-blue-950 rounded-md">
              <h1>ADD NURSE</h1>
            </div>
          </Link>
          <Link href={"/signup"}>
            <div className="bg-blue-950 font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80  hover:bg-blue-950 rounded-md">
              <h1>ADD PHARMACIST</h1>
            </div>
          </Link>
          <Link href={"/signup"}>
            <div className="bg-blue-950 font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80  hover:bg-blue-950 rounded-md">
              <h1>ADD FRONT DESK</h1>
            </div>
          </Link>
        </div>

    </div>
  )
}

export default AddOpeationsPage