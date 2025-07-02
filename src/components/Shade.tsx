import { Rect, useRoot } from "react-tela"

export const Shade = () => {
  const root = useRoot()
  return <Rect width={root.ctx.canvas.width} height={root.ctx.canvas.height} fill='rgba(0,0,0,0.5)' />
}