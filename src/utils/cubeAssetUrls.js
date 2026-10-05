import dinoIcon from '../assets/brand/dino-icon.webp';
import metrics from '../assets/cube-labels/metrics.json';
const labels = import.meta.glob('../assets/cube-labels/*.webp', { eager: true, query: '?url', import: 'default' });
export const cubeAssets = { icon: dinoIcon, labels, metrics };
