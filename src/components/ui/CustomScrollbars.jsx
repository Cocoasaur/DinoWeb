import { useEffect } from 'react';
import '../../styles/custom-scrollbars.css';

const SELECTOR = '.overlay-scroll, .about-contributions-calendar, [data-custom-scroll]';
let nextId = 0;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Real DOM thumbs retain pointer events and capture during a drag. Native
// browser thumbs cannot supply those events to the portfolio's cursor.
export default function CustomScrollbars() {
    useEffect(() => {
        const records = new Map();
        const layer = document.createElement('div');
        layer.className = 'portfolio-scrollbars';
        document.body.appendChild(layer);
        let frame = 0;
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };
        const resize = new ResizeObserver(schedule);

        function add(scroller) {
            const generatedId = !scroller.id;
            if (generatedId) scroller.id = `portfolio-scrollport-${++nextId}`;
            const axes = ['vertical', 'horizontal'].map(orientation => {
                const vertical = orientation === 'vertical';
                // The calendar's body owns its fade. Keep this rail beside the
                // native scrollport so browser layout handles page scrolling,
                // clipping, and opacity together, without a fixed overlay lag.
                const local = !vertical && scroller.matches('.about-contributions-calendar');
                const bar = document.createElement('div');
                const thumb = document.createElement('span');
                bar.className = 'portfolio-scrollbar';
                bar.dataset.orientation = orientation;
                if (local) bar.dataset.placement = 'local';
                bar.setAttribute('role', 'scrollbar');
                bar.setAttribute('aria-label', `${scroller.getAttribute('aria-label') || 'Content'} ${orientation} scroll`);
                bar.setAttribute('aria-orientation', orientation);
                bar.setAttribute('aria-controls', scroller.id);
                bar.setAttribute('aria-valuemin', '0');
                bar.setAttribute('aria-valuemax', '100');
                bar.tabIndex = 0;
                thumb.className = 'portfolio-scrollbar__thumb';
                bar.appendChild(thumb);
                // Stay within the modal's accessibility tree while escaping
                // the scrolling element's content and clipping.
                const host = local ? scroller.parentElement : scroller.closest('[role="dialog"]') || layer;
                host.appendChild(bar);
                const axis = { bar, thumb, vertical, local, range: 0, travel: 0, drag: null };
                const getPosition = () => vertical ? scroller.scrollTop : scroller.scrollLeft;
                const setPosition = value => {
                    if (vertical) scroller.scrollTop = value;
                    else scroller.scrollLeft = value;
                    schedule();
                };
                bar.addEventListener('pointerdown', event => {
                    if (event.button !== 0 || !axis.travel) return;
                    event.preventDefault();
                    event.stopPropagation();
                    bar.dataset.pointerFocus = 'true';
                    bar.focus({ preventScroll: true });
                    const coordinate = vertical ? event.clientY : event.clientX;
                    if (event.target !== thumb) {
                        const rect = bar.getBoundingClientRect();
                        const length = vertical ? thumb.offsetHeight : thumb.offsetWidth;
                        setPosition((coordinate - (vertical ? rect.top : rect.left) - length / 2) / axis.travel * axis.range);
                    }
                    axis.drag = { pointerId: event.pointerId, coordinate, position: getPosition() };
                    bar.dataset.dragging = 'true';
                    bar.setPointerCapture(event.pointerId);
                });
                bar.addEventListener('pointermove', event => {
                    if (axis.drag?.pointerId !== event.pointerId) return;
                    const coordinate = vertical ? event.clientY : event.clientX;
                    setPosition(axis.drag.position + (coordinate - axis.drag.coordinate) / axis.travel * axis.range);
                });
                const release = () => {
                    axis.drag = null;
                    delete bar.dataset.dragging;
                };
                bar.addEventListener('lostpointercapture', release);
                bar.addEventListener('pointercancel', release);
                bar.addEventListener('pointerup', event => {
                    if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId);
                    release();
                });
                bar.addEventListener('blur', () => { delete bar.dataset.pointerFocus; });
                bar.addEventListener('keydown', event => {
                    const page = vertical ? scroller.clientHeight : scroller.clientWidth;
                    const changes = vertical ? { ArrowUp: -40, ArrowDown: 40 } : { ArrowLeft: -40, ArrowRight: 40 };
                    const change = changes[event.key] ?? ({ PageUp: -page, PageDown: page }[event.key]);
                    if (change === undefined && event.key !== 'Home' && event.key !== 'End') return;
                    delete bar.dataset.pointerFocus;
                    event.preventDefault();
                    setPosition(event.key === 'Home' ? 0 : event.key === 'End' ? axis.range : getPosition() + change);
                });
                bar.addEventListener('wheel', event => {
                    const delta = vertical ? event.deltaY : event.deltaX || event.deltaY;
                    const value = getPosition();
                    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? (vertical ? scroller.clientHeight : scroller.clientWidth) : 1;
                    setPosition(value + delta * unit);
                    if (getPosition() !== value) event.preventDefault();
                    else {
                        // The rails are portaled; reproduce native wheel chaining
                        // when a nested viewer has reached its boundary.
                        for (let parent = scroller.parentElement?.closest(SELECTOR); parent; parent = parent.parentElement?.closest(SELECTOR)) {
                            const before = parent.scrollTop;
                            parent.scrollTop += event.deltaY * unit;
                            if (parent.scrollTop !== before) { event.preventDefault(); break; }
                        }
                    }
                }, { passive: false });
                return axis;
            });
            scroller.dataset.scrollbars = 'custom';
            records.set(scroller, { axes, generatedId, children: new Set() });
            resize.observe(scroller);
        }

        function remove(scroller, record) {
            for (const axis of record.axes) axis.bar.remove();
            resize.unobserve(scroller);
            for (const child of record.children) resize.unobserve(child);
            delete scroller.dataset.scrollbars;
            if (record.generatedId) scroller.removeAttribute('id');
            records.delete(scroller);
        }

        function discover() {
            for (const [scroller, record] of records) if (!scroller.isConnected) remove(scroller, record);
            for (const scroller of document.querySelectorAll(SELECTOR)) {
                if (!records.has(scroller)) add(scroller);
                const record = records.get(scroller);
                for (const child of record.children) {
                    if (child.parentElement !== scroller) { resize.unobserve(child); record.children.delete(child); }
                }
                for (const child of scroller.children) if (!record.children.has(child)) {
                    resize.observe(child);
                    record.children.add(child);
                }
            }
            schedule();
        }

        function measure() {
            frame = 0;
            // Read every scrollport before writing scrollbar geometry.
            const measurements = [...records].map(([scroller, record]) => {
                const rect = scroller.getBoundingClientRect();
                const bounds = { top: 0, left: 0, right: innerWidth, bottom: innerHeight };
                let shown = Boolean(rect.width && rect.height);
                for (let parent = scroller.parentElement; parent; parent = parent.parentElement) {
                    const style = getComputedStyle(parent);
                    if (style.visibility === 'hidden' || style.display === 'none' || style.pointerEvents === 'none') shown = false;
                    if (/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) {
                        const clip = parent.getBoundingClientRect();
                        bounds.top = Math.max(bounds.top, clip.top);
                        bounds.left = Math.max(bounds.left, clip.left);
                        bounds.right = Math.min(bounds.right, clip.right);
                        bounds.bottom = Math.min(bounds.bottom, clip.bottom);
                        // Keep nested rails clear of an ancestor's hit area,
                        // even when the two scrollports share the same edge.
                        if (records.has(parent)) {
                            if (parent.scrollHeight > parent.clientHeight + 1) bounds.right = Math.min(bounds.right, clip.left + parent.clientLeft + parent.clientWidth - 12);
                            if (parent.scrollWidth > parent.clientWidth + 1) bounds.bottom = Math.min(bounds.bottom, clip.top + parent.clientTop + parent.clientHeight - 12);
                        }
                    }
                }
                shown &&= rect.left < bounds.right && rect.right > bounds.left && rect.top < bounds.bottom && rect.bottom > bounds.top;
                return { scroller, record, rect, bounds, shown,
                    width: scroller.clientWidth, height: scroller.clientHeight,
                    scrollWidth: scroller.scrollWidth, scrollHeight: scroller.scrollHeight,
                    left: scroller.scrollLeft, top: scroller.scrollTop,
                    borderX: scroller.clientLeft, borderY: scroller.clientTop,
                    offsetX: scroller.offsetLeft, offsetY: scroller.offsetTop };
            });
            for (const m of measurements) for (const axis of m.record.axes) {
                const { bar, thumb, vertical, local } = axis;
                const extent = vertical ? m.height : m.width;
                const total = vertical ? m.scrollHeight : m.scrollWidth;
                const range = Math.max(0, total - extent);
                const otherAxis = vertical ? m.scrollWidth > m.width + 1 : m.scrollHeight > m.height + 1;
                const length = extent - (otherAxis ? 12 : 0);
                const size = Math.min(length, Math.max(32, length * extent / total));
                const travel = Math.max(0, length - size);
                const x = vertical ? Math.min(m.rect.left + m.borderX + m.width, m.bounds.right) - 12 : m.rect.left + m.borderX;
                const y = vertical ? m.rect.top + m.borderY : Math.min(m.rect.top + m.borderY + m.height, m.bounds.bottom) - 12;
                const width = vertical ? 12 : length, height = vertical ? length : 12;
                bar.hidden = !m.shown || range <= 1 || length <= 0 || x >= m.bounds.right || x + width <= m.bounds.left || y >= m.bounds.bottom || y + height <= m.bounds.top;
                axis.range = range;
                axis.travel = travel;
                if (bar.hidden) continue;
                Object.assign(bar.style, local ? {
                    left: `${m.offsetX + m.borderX}px`,
                    top: `${m.offsetY + m.borderY + m.height - 12}px`,
                    width: `${width}px`, height: `${height}px`,
                } : {
                    left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`,
                    clipPath: `inset(${Math.max(0, m.bounds.top - y)}px ${Math.max(0, x + width - m.bounds.right)}px ${Math.max(0, y + height - m.bounds.bottom)}px ${Math.max(0, m.bounds.left - x)}px)`,
                });
                const progress = range ? clamp((vertical ? m.top : m.left) / range, 0, 1) : 0;
                thumb.style[vertical ? 'height' : 'width'] = `${size}px`;
                thumb.style.transform = `translate3d(${vertical ? 0 : progress * travel}px, ${vertical ? progress * travel : 0}px, 0)`;
                bar.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
            }
        }

        const mutations = new MutationObserver(discover);
        mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-phase'] });
        document.addEventListener('scroll', schedule, { capture: true, passive: true });
        window.addEventListener('resize', schedule);
        discover();
        return () => {
            mutations.disconnect();
            resize.disconnect();
            cancelAnimationFrame(frame);
            document.removeEventListener('scroll', schedule, true);
            window.removeEventListener('resize', schedule);
            for (const [scroller, record] of records) remove(scroller, record);
            layer.remove();
        };
    }, []);
    return null;
}
