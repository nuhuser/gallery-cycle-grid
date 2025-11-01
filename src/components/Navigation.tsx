export const Navigation = () => {
  return (
    <nav className="fixed top-8 right-8 z-50">
      <div className="backdrop-elegant rounded-lg px-6 py-3 border border-border/50">
        <ul className="flex flex-col space-y-4 text-sm font-medium">
          <li>
            <a 
              href="#projects" 
              className="text-foreground hover:text-hero-accent transition-colors duration-300 uppercase tracking-wider"
            >
              Projects
            </a>
          </li>
          <li>
            <a 
              href="#work" 
              className="text-foreground hover:text-hero-accent transition-colors duration-300 uppercase tracking-wider"
            >
              Work
            </a>
          </li>
          <li>
            <a 
              href="#contact" 
              className="text-foreground hover:text-hero-accent transition-colors duration-300 uppercase tracking-wider"
            >
              Contact
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};