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
    useContactsMotion(root, motionReady);
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
        <div className="contact-introduction">
            <Reveal><p className="contact-kicker">Good things begin with a conversation.</p><h2>Have something<br />in <em>mind?</em></h2><p className="contact-intro-copy">A project, a question, or a simple hello.<br />There’s a place for it here.</p></Reveal>
        </div>
        <div className="contact-desk">
            <div className="contact-envelope" aria-hidden="true"><span>PERSONAL CORRESPONDENCE</span><span>04</span></div>
            <Reveal className="contact-letter-anchor" paper>
                <section className="contact-letter" aria-label="Contact details">
                    <div className="contact-letter-top"><div><p className="contact-kicker">To</p><p className="contact-recipient">John Jessienel Arquesola</p></div><span className="contact-letter-mark" aria-hidden="true">JL<span>LET’S TALK</span></span></div>
                    <div className="contact-direct"><p className="contact-kicker">My inbox is a good place to start</p><a className="contact-email-link" href={`mailto:${EMAIL}`} data-cursor-label="EMAIL">cocoasaurjl@<wbr />gmail.com <Arrow diagonal /></a><p>For project inquiries, collaborations, or a simple hello.<br />Copy my address and reach out whenever you’re ready.</p></div>
                    <div className="contact-letter-bottom"><p>Prefer to write in your own time?<br />Keep my email address handy.</p><button type="button" className="contact-copy" onClick={copyEmail} aria-label="Copy email address" data-cursor-label="COPY">{copyStatus === 'Email address copied.' ? 'Email copied' : 'Copy email address'}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" stroke="currentColor" strokeWidth="1.4" /><path d="M15 5V4H4v11h1" stroke="currentColor" strokeWidth="1.4" /></svg></button></div>
                </section>
            </Reveal>
            <div className="contact-desk-caption"><span>A note is all it takes.</span><span>NO. 004 / CONTACT</span></div>
        </div>
        <Reveal className="contact-availability"><div className="contact-availability-copy"><span className="contact-kicker">Between classes & creating</span><p>Busy with academics and projects, but open to offers and collaborations.</p></div><dl><div><dt>Replies</dt><dd>Usually within 24–48 hours</dd></div><div><dt>Languages</dt><dd>English & Filipino</dd></div></dl></Reveal>
        <nav className="contact-socials" aria-label="Find me elsewhere">{SOCIALS.map((social, index) => <Reveal key={social.label}><a href={social.href} target="_blank" rel="noopener noreferrer"><span className="contact-social-number">0{index + 1}</span><span><strong>{social.label}</strong><small>{social.detail}</small></span><Arrow diagonal /></a></Reveal>)}</nav>
        <footer className="contact-signoff"><Reveal><p>See you on the<br /><em>other side.</em></p><span>John Jessienel M. Arquesola / Philippines</span></Reveal></footer>
        <span className="contact-copy-status" role="status" aria-live="polite">{copyStatus}</span>
    </div>;
}
