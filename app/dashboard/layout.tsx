import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      redirect("/auth/login");
      return null; // Prevent rendering if redirecting
    }

    
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, organization:organizations(*)")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      redirect("/auth/login");
      return null; // Prevent rendering if redirecting
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav user={data.user} profile={profile} />
        <main
          id="main-content"
          className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          role="main"
          aria-label="Dashboard content"
        >
          <div className="space-y-6">{children}</div>
        </main>
        {/* To add logout, use a client-side component in DashboardNav or a separate button in dashboard pages */}
      </div>
    );
  } catch (err) {
    console.error("Error in DashboardLayout:", err);
    // redirect("/auth/login");
    return; // Prevent rendering if redirecting
  }
}
// import React from "react";
// import { redirect } from "next/navigation";
// import { createClient } from "@/lib/supabase/server";
// import { DashboardNav } from "@/components/dashboard/dashboard-nav";

// export default async function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const supabase = await createClient();

//   try {
//     const { data, error } = await supabase.auth.getUser();
//     if (error || !data?.user) {
//       redirect("/auth/login");
//       return null; // Prevent rendering if redirecting
//     }

//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("*, organization:organizations(*)")
//       .eq("id", data.user.id)
//       .single();

//     if (!profile) {
//       redirect("/auth/login");
//       return null; // Prevent rendering if redirecting
//     }

//     return (
//       <div className="min-h-screen bg-gray-50">
//         <DashboardNav user={data.user} profile={profile} />
//         <main
//           id="main-content"
//           className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
//           role="main"
//           aria-label="Dashboard content"
//         >
//           <div className="space-y-6">{children}</div>
//         </main>
//       </div>
//     );
//   } catch (err) {
//     console.error("Error in DashboardLayout:", err);
//     redirect("/auth/login");
//     return null; // Prevent rendering if redirecting
//   }
// }
