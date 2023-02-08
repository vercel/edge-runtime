import {
  ArrowPathIcon,
  FingerPrintIcon,
  CloudArrowUpIcon,
  BoltIcon,
  CpuChipIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Web APIs',
    icon: ArrowPathIcon,
  },
  {
    name: 'Context isolation',
    icon: FingerPrintIcon,
  },
  {
    name: 'Easy to extend',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Lightweight',
    description: `Execute builds using every core at maximum parallelism without wasting idle CPUs.`,
    icon: BoltIcon,
  },
  {
    name: 'Written in TypeScript',
    description: `Define the relationships between your tasks and then let Turborepo optimize what to build and when.`,
    icon: ArrowsPointingOutIcon,
  },
  {
    name: 'Node.js 14 or higher',
    description: `Turborepo doesn't interfere with your runtime code or touch your sourcemaps. It does what it does and then gets out of your way.`,
    icon: CpuChipIcon,
  },
]

function Features() {
  return (
    <>
      <div className='grid grid-cols-2 gap-6 my-12 sm:grid-cols-3 '>
        {features.map(({ icon: Icon, ...feature }, i) => (
          <div
            className='flex items-center space-x-4'
            key={feature.name.split(' ').join('-')}
          >
            <div>
              <Icon
                className='block w-8 h-8'
                style={{ height: 24, width: 24 }}
                aria-hidden='true'
              />
            </div>
            <div>
              <div className='my-0 font-medium dark:text-white'>
                {feature.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default Features
