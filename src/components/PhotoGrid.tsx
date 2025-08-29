import grid1 from '@/assets/grid-1.jpg';
import grid2 from '@/assets/grid-2.jpg';
import grid3 from '@/assets/grid-3.jpg';
import grid4 from '@/assets/grid-4.jpg';
import grid5 from '@/assets/grid-5.jpg';
import grid6 from '@/assets/grid-6.jpg';

const gridItems = [
  {
    src: grid1,
    title: 'Product Design',
    category: 'Industrial'
  },
  {
    src: grid2,
    title: 'Fashion Forward',
    category: 'Photography'
  },
  {
    src: grid3,
    title: 'Digital Patterns',
    category: 'Graphic Design'
  },
  {
    src: grid4,
    title: 'Typography Study',
    category: 'Branding'
  },
  {
    src: grid5,
    title: 'Gallery Space',
    category: 'Installation'
  },
  {
    src: grid6,
    title: 'Brand Identity',
    category: 'Packaging'
  }
];

export const PhotoGrid = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      {gridItems.map((item, index) => (
        <div
          key={index}
          className="photo-grid-item group cursor-pointer"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <img
            src={item.src}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-white/80">{item.category}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};