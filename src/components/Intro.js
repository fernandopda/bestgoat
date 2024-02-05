import introSoccerBalls from "./img/dalle-img2.png";
import { IconSoccer, IconTv, IconVote } from "./img/Icons";

function Intro({ }) {
    return (
        <div className="intro-container">
            <div className="intro-boxes">
                <div className="intro-box">
                    <div className="intro-box-container">
                        <IconSoccer />
                        <h3>Pick Your Favorite Goal</h3>
                        <p>Browse our collection of incredible goals scored throughout football history and select your favorite.</p>
                    </div>
                </div>
                <div className="intro-box" >
                    <div className="intro-box-container">
                        <IconVote />
                        <h3>Cast Your Vote</h3>
                        <p>Once you've chosen your favorite goal, cast your vote and contribute to our Top 10. To maintain fairness, each user is allowed only one vote! </p>
                    </div>
                </div>
                <div className="intro-box">
                    <div className="intro-box-container">
                        <IconTv />
                        <h3>Watch Top 10</h3>
                        <p>Now, sit back and enjoy the lineup of the most beautiful goals ever scored in football history.</p>
                    </div>
                </div>
            </div>
            <div className="intro-balls-image">
                <img src={introSoccerBalls} alt="introSoccerBalls"></img>
            </div>


        </div>
    )
}

export default Intro;