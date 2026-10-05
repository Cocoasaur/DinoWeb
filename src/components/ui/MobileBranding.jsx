import BrandWordmark from './BrandWordmark';

export default function MobileBranding() {
    return (
        <div className="mobile-branding mobile-branding-entrance">
            <div className="mobile-branding__lockup" role="img" aria-label="DINOWEB">
                <h1 className="sr-only">DINOWEB</h1>
                <BrandWordmark variant="dino" className="mobile-branding__dino" aria-hidden="true" />
                <div className="mobile-branding__version">
                    VERSION:<br />NOT_A_FOSSIL<br />_YET
                </div>
                <div className="mobile-branding__den">JL'S DEV DEN</div>
                <BrandWordmark variant="web" className="mobile-branding__web" aria-hidden="true" />
            </div>
        </div>
    );
}
