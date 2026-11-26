'use client';
import { useEffect, useState } from 'react';

// Relógio de São José dos Campos (microinformação editorial; atualiza a cada 30 s). Antes de carregar mostra "--:--".
export function LocalTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date());
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>SJC {time || '--:--'}</span>;
}
