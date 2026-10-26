import { useEffect, useRef, useState } from 'react';
import { useContactsMotion } from '../hooks/useContactsMotion';
import '../styles/contacts-layout.css';

const EMAIL = 'cocoasaurjl@gmail.com';
const SOCIALS = [
    { label: 'GitHub', detail: 'Code & experiments', href: 'https://github.com/Cocoasaur' },
    { label: 'LinkedIn', detail: 'Work & connections', href: 'https://linkedin.com/in/dinoweb' },
    { label: 'Stack Overflow', detail: 'Questions & answers', href: 'https://stackoverflow.com/users/24706411/jlkoko' },
];
function Arrow({ diagonal = false }) {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={diagonal ? { transform: 'rotate(-45deg)' } : undefined}><path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" /></svg>;
}
function Reveal({ children, className = '', paper = false }) {
    return <div className={`contact-anchor ${className}`} data-contact-anchor><div data-contact-reveal data-contact-paper={paper || undefined}>{children}</div></div>;
}

export default function ContactsPage({ motionReady = true }) {
    const root = useRef(null);
    const timer = useRef(0);
    const mounted = useRef(false);
    const [copyStatus, setCopyStatus] = useState('');
    useContactsMotion(root, motionReady, copyStatus);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; window.clearTimeout(timer.current); };
    }, []);
    const copyEmail = async () => {
        let copied;
        try { await navigator.clipboard.writeText(EMAIL); copied = true; }
        catch {
            const active = document.activeElement;
            const input = document.createElement('textarea');
            input.value = EMAIL;
            input.setAttribute('readonly', '');
            Object.assign(input.style, { position: 'fixed', opacity: '0', left: '-9999px' });
            document.body.appendChild(input);
            try { input.select(); copied = document.execCommand('copy'); }
            catch { copied = false; }
            finally { input.remove(); active?.focus({ preventScroll: true }); }
        }
        if (!mounted.current) return;
        setCopyStatus(copied ? 'Email address copied.' : 'Couldn’t copy. You can select the email address.');
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => { if (mounted.current) setCopyStatus(''); }, 4000);
    };
    return <div className="contacts-page" ref={root}>
        <div className="contact-scroll-progress" aria-hidden="true"><span className="contact-scroll-progress-fill" /></div>
        <div className="contact-introduction">
            <Reveal><p className="contact-kicker">Good things begin with a conversation.</p></Reveal>
            <Reveal><h2>Have something<br />in <em>mind?</em></h2></Reveal>
            <Reveal><p className="contact-intro-copy">A project, a question, or a simple hello.<br />There’s a place for it here.</p></Reveal>
        </div>
        <div className="contact-desk">
            <div className="contact-envelope" data-contact-anchor aria-hidden="true">
                <div className="contact-envelope-face" data-contact-reveal data-contact-paper>
                    <span>PERSONAL CORRESPONDENCE</span><span>04</span>
                </div>
            </div>
            <div className="contact-letter-anchor">
                <div>
                    <section className="contact-letter" aria-label="Contact details">
                        <div className="contact-letter-top">
                            <div className="contact-recipient-copy">
                                <Reveal><p className="contact-kicker">To</p></Reveal>
                                <Reveal><p className="contact-recipient">John Jessienel Arquesola</p></Reveal>
                            </div>
                            <Reveal className="contact-mark-anchor" paper><span className="contact-letter-mark" aria-hidden="true">JL<span>LET’S TALK</span></span></Reveal>
                        </div>
                        <div className="contact-direct">
                            <Reveal><p className="contact-kicker">My inbox is a good place to start</p></Reveal>
                            <Reveal paper><a className="contact-email-link" href={`mailto:${EMAIL}`} data-cursor-label="EMAIL">cocoasaurjl@<wbr />gmail.com <Arrow diagonal /></a></Reveal>
                            <Reveal><p className="contact-direct-copy">For project inquiries, collaborations, or a simple hello.<br />Copy my address and reach out whenever you’re ready.</p></Reveal>
                        </div>
                        <div className="contact-letter-bottom">
                            <Reveal><p>Prefer to write in your own time?<br />Keep my email address handy.</p></Reveal>
                            <Reveal className="contact-copy-anchor" paper><button type="button" className="contact-copy" onClick={copyEmail} aria-label="Copy email address" data-cursor-label="COPY">{copyStatus === 'Email address copied.' ? 'Email copied' : 'Copy email address'}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" stroke="currentColor" strokeWidth="1.4" /><path d="M15 5V4H4v11h1" stroke="currentColor" strokeWidth="1.4" /></svg></button></Reveal>
                        </div>
                    </section>
                </div>
            </div>
            <div className="contact-desk-caption">
                <Reveal><span>A note is all it takes.</span></Reveal>
                <Reveal><span>NO. 004 / CONTACT</span></Reveal>
            </div>
        </div>
        <section className="contact-availability" aria-label="Availability">
            <div className="contact-availability-layout">
                <div className="contact-availability-copy">
                    <Reveal><span className="contact-kicker">Between classes & creating</span></Reveal>
                    <Reveal><p>Busy with academics and projects, but open to offers and collaborations.</p></Reveal>
                </div>
                <dl>
                    <div data-contact-anchor><dt data-contact-reveal>Replies</dt><dd data-contact-reveal>Usually within 24–48 hours</dd></div>
                    <div data-contact-anchor><dt data-contact-reveal>Languages</dt><dd data-contact-reveal>English & Filipino</dd></div>
                </dl>
            </div>
        </section>
        <nav className="contact-socials" aria-label="Find me elsewhere">{SOCIALS.map((social, index) => <Reveal key={social.label} paper><a href={social.href} target="_blank" rel="noopener noreferrer"><span className="contact-social-number">0{index + 1}</span><span><strong>{social.label}</strong><small>{social.detail}</small></span><Arrow diagonal /></a></Reveal>)}</nav>
        <footer className="contact-signoff">
            <Reveal><p>See you on the<br /><em>other side.</em></p></Reveal>
            <Reveal><span>John Jessienel M. Arquesola / Philippines</span></Reveal>
        </footer>
        <span className="contact-copy-status" role="status" aria-live="polite">{copyStatus}</span>
    </div>;
}
