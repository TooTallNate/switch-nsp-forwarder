import { useState, useCallback } from 'react';
import { Group, Rect, Text, useRoot } from 'react-tela';
import { AppIcon } from './AppIcon';
import { FilePicker } from './FilePicker';
import { FooterItem } from './Footer';
import { useGamepadButton } from '../hooks/use-gamepad';
import { AppIconFromImageUrl } from '../utils/util';

export interface AppIconSelectorProps {
  icon: ArrayBuffer | undefined;
  focused: boolean;
  x: number;
  y: number;
  /** Returns a new iconBuffer when selecting a supported image */
  onChange: (icon: ArrayBuffer) => void;
  onClick?: () => void;
}

export function AppIconSelector({ icon, focused, x, y, onChange, onClick }: AppIconSelectorProps) {
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const root = useRoot();

  useGamepadButton(
    'A',
    () => {
      if (focused && !filePickerOpen && !errorModal) {
        setFilePickerOpen(true);
      }
    },
    [focused, errorModal],
    true
  );

  const handleFileSelect = useCallback(async (url: URL) => {
    try {
      const iconBuf = await AppIconFromImageUrl(url);
      onChange(iconBuf);
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'Unknown error');
    }
    setFilePickerOpen(false);
  }, [onChange]);

  return (
    <>
      <Group x={x} y={y} width={260} height={260} onTouchEnd={onClick}>
        <AppIcon icon={icon} width={256} height={256} x={2} y={2}/>
        <Rect
          width={focused ? 260 : 256}
          height={focused ? 260 : 256}
          stroke={focused ? '#00ffca' : 'rgba(255, 255, 255, 0.5)'}
          lineWidth={focused ? 4 : 2}
          x={focused ? 0 : 2}
          y={focused ? 0 : 2}
        />
      </Group>
      {filePickerOpen && (
        <>
          <Rect width={root.ctx.canvas.width} height={root.ctx.canvas.height} fill='rgba(0,0,0,0.5)' />
          <FilePicker
            onSelect={handleFileSelect}
            onClose={() => setFilePickerOpen(false)}
          />
        </>
      )}
      {errorModal && (
        <Group width={400} height={160} x={x + 128 - 200} y={y + 128 - 80}>
          <Rect width={400} height={160} fill='black' stroke='white' lineWidth={4} />
          <Text fill='white' fontSize={22} x={20} y={40}>{errorModal}</Text>
          <FooterItem button='A' x={170}>OK</FooterItem>
        </Group>
      )}
    </>
  );
} 