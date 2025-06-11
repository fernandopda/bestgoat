import bestgoatlogo from "./img/bestGoat.png";
import PrivacyPolicy from "./PrivacyPolicy";

function Footer({ }) {

    return (
        <footer className="footer">
            <div className="landing-page-logo">
                <img src={bestgoatlogo} alt="Best Goals Of All Time logo" />
            </div>
            <PrivacyPolicy />
            <p>&copy; 2025 BestGOAT. All rights reserved.</p>
        </footer>
    );
}
export default Footer;
