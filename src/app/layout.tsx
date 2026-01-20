import MobileAppBlocker from "@/components/mobile";
import { ApiContextProvider } from "@/context/ApiContext";
import { SessionProvider } from "@/context/auth";
import moment from "moment";
import "moment/locale/pt-br";
import { CookiesProvider } from "next-client-cookies/server";
import { Poppins } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import "swiper/css";
import "./globals.css";
moment.locale("pt-br");
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: {
    default: process.env.PROJECT_NAME || "Health Voice",
  },
  icons: {
    icon: "/icon.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="custom-scrollbar">
      <head>
        <meta name="viewport" />
        <Script id="ms_clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "tucseh4wc5");`}
        </Script>
      </head>
      <body className={`${poppins.variable} bg-neutral-100 text-black`}>
        <NextTopLoader
          color="linear-gradient(to right, #0d78ec, #3b82f6, #60a5fa)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #0d78ec,0 0 5px #0d78ec"
        />
        <MobileAppBlocker />

        <Toaster
          containerStyle={{
            bottom: 40,
            left: 20,
            right: 20,
          }}
          position="top-center"
          gutter={10}
          toastOptions={{
            duration: 2000,
          }}
        />
        <CookiesProvider>
          <ApiContextProvider>
            <SessionProvider>{children}</SessionProvider>
          </ApiContextProvider>
        </CookiesProvider>
      </body>
    </html>
  );
}
