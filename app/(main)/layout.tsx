import React from 'react'

const MainLayout = async ({ children }: any) => {
  return (
    <div className='container mx-auto my-32'>{children}</div>
  )
}

export default MainLayout