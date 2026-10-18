import { useEffect, useState } from "react";
import { supabase } from "../auth/supabase";
import type { Session } from "@supabase/supabase-js";

function Home({ user }: { user: any}) {
  const [_loading, setLoading] = useState(true)
  const [email, setEmail] = useState(null)

  useEffect(() => {
    let ignore = false

    async function getProfile() {
      setLoading(true)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log(user?.id)

      const { data, error } = await supabase
        .from('profiles')
        .select(`email_address`)
        .eq('id', user?.id)
        .single()

      console.log(data)

      if (!ignore) {
        if (error) {
          console.warn(error)
        } else if (data) {
          setEmail(data.email_address)
          console.log("this is email: " + data.email_address)
          // console.log("this is id: " + user.id)
        }
      }

      setLoading(false)
    }

    getProfile()

    return () => {
      ignore = true
    }
  }, [user])

  return (
    <h1>
      Welcome back {email}!
    </h1>
  )
}

export default Home;