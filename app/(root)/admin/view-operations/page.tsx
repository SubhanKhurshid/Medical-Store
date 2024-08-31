import Link from 'next/link'
import React from 'react'

const ViewOperationsPage = () => {
  return (
    <div className='flex flex-col items-center justify-center mt-32 gap-10'>
       <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-3xl md:text-5xl max-w-3xl font-bold tracking-tighter">
            View your desired item from here
          </h1>
          <h1>Select the operation you want to perform</h1>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center justify-center md:gap-3">
          <Link href={"/admin/view-doctors"}>
            <div className="bg-blue-950  font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80 hover:bg-blue-950 rounded-md">
              <h1>VIEW DOCTORS</h1>
            </div>
          </Link>
          <Link href={"/admin/view-nurses"}>
            <div className="bg-blue-950 font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80  hover:bg-blue-950 rounded-md">
              <h1>VIEW NURSES</h1>
            </div>
          </Link>
          <Link href={"/admin/view-pharmacists"}>
            <div className="bg-blue-950 font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80  hover:bg-blue-950 rounded-md">
              <h1>VIEW PHARMACISTS</h1>
            </div>
          </Link>
          <Link href={"/admin/view-frontdesk"}>
            <div className="bg-blue-950 font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80  hover:bg-blue-950 rounded-md">
              <h1>VIEW FRONT DESK</h1>
            </div>
          </Link>
        </div>

    </div>
  )
}

export default ViewOperationsPage