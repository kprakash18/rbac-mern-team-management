export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center mb-5">
      <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-stack-md">
        <img
          alt="Company Logo"
          className="w-8 h-8 object-contain"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhb6RQIo7Xltq8YA9N8Pb4FF5xZPkIfCix-dIZiKMgxvkirh_tsgTL0EwrbPSjJXg4nfUaKZfs89vRMwWhBZDHuZq1xpMO5iVUSk0aD08hdwswA3GVm6HM8EgXVdIvedPqgw6u0t4iajZ79HZIrx3C0pOpQGhA9pSQGqtrn8GJ2R9j8wFiLZtzoMwpW1y0BO6GGbVdyC-3ILZOkV2-NgyvECE2gSWOKNEsGf42jX5EtnHJKQGDp3Bl-Q"
        />
      </div>
      <h1 className="text-[22px] font-semibold text-on-surface mb-stack-sm leading-tight tracking-tight">
        {title}
      </h1>
      <p className="font-body-md text-on-surface-variant">
        {subtitle}
      </p>
    </div>
  );
}
