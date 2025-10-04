import React from 'react'
import AppRoutes from './routes/AppRoutes'   // make sure case matches
import { UserProvider } from './context/user.context'

const App = () => {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}

export default App
