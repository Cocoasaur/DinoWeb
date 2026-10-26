// Shared by the overlay pages: measurements use layout, never animated bounds.
export function layoutTop(element, scroller) {
    let top = 0;
    for (let node = element; node && node !== scroller; node = node.offsetParent) top += node.offsetTop;
    return top;
}

export function revealStart(element, scroller) {
    return Math.min(scroller.scrollHeight - scroller.clientHeight - 1,
        layoutTop(element, scroller) - scroller.clientHeight * .96);
}

export function scrollRevealBounds(anchor, scroller, scrollStagger = 0) {
    const top = layoutTop(anchor, scroller);
    const height = scroller.clientHeight;
    const maxScroll = scroller.scrollHeight - height;
    const enterStart = Math.min(maxScroll - 1, revealStart(anchor, scroller) + scrollStagger);
    const enterEnd = Math.max(enterStart + 1, Math.min(maxScroll, top - height * .84 + scrollStagger));
    // Begin in the upper third; finish while the element is still in view.
    const exitStart = Math.max(0, enterEnd, top + anchor.offsetHeight - height * .34 + scrollStagger * .15);
    const exitEnd = Math.max(exitStart + 1, top + anchor.offsetHeight - height * .08 + scrollStagger * .5);
    return { enterStart, enterEnd, exitStart, exitEnd };
}
