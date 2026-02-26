import ContactSidebar from '@/components/contact/ContactSidebar';

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container max-w-6xl py-10 md:py-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <ContactSidebar />
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
