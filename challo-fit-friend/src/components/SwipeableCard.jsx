import { motion, useMotionValue, useTransform } from 'framer-motion'

export default function SwipeableCard({ children, onDelete }) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-80, -20], [1, 0])

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, marginBottom: 8 }}>
      <motion.div
        data-testid="delete-zone"
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          background: 'var(--chili)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: deleteOpacity,
        }}
      >
        <span style={{ fontSize: 22 }}>🗑️</span>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.05}
        style={{ x }}
        onDragEnd={(_, info) => { if (info.offset.x < -60) onDelete() }}
      >
        {children}
      </motion.div>
    </div>
  )
}
