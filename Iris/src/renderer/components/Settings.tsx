// Settings.tsx
import React, { useState, useEffect, act } from 'react';
import { ArrowForwardIosRounded } from '@mui/icons-material';
import secureLocalStorage from "react-secure-storage";
import './Settings.scss';

import Iris from '../../assets/icons/IrisWideTransparent.png'

export interface EnabledModules {
    Spotify: boolean;
    Discord: boolean;
    Hoyolab: boolean;
}

export const DEFAULT_MODULES: EnabledModules = {
    Spotify: true,
    Discord: true,
    Hoyolab: true
};

interface SettingsProps {
    isSettings: boolean;
    setIsSettings: (value: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({
    isSettings,
    setIsSettings: setIsSettings,
}) => {
    const [navigationPath, setNavigationPath] = useState<string[]>(['Settings']);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [installStatus, setInstallStatus] = useState<string>('');
    const [isInstalling, setIsInstalling] = useState(false);

    const modules: Array<keyof EnabledModules> = ['Spotify', 'Discord', 'Hoyolab'];
    const [enabledModules, setEnabledModules] = useState<EnabledModules>(() => {
        // Load saved module states from secure storage, defaulting to DEFAULT_MODULES
        const savedModules = secureLocalStorage.getItem('enabled_modules');
        if (savedModules) {
            return JSON.parse(savedModules as string) as EnabledModules;
        }
        return DEFAULT_MODULES;
    });

    const generalOptions = [
        'Spotify Settings',
        'Hoyolab Settings',
        'Discord Settings',
        'Modules',
    ];

    const [tempModules, setTempModules] = useState<EnabledModules>(enabledModules);

    useEffect(() => {
        if (isSettings) {
            setTempModules(enabledModules);
        }
    }, [isSettings]);

    const handleMenuSelect = (menu: string) => {
        window.electron.log(`Menu selected: ${menu}`)
        // Build the full path based on current navigation
        let newPath: string[];

        // If we're in the main menu (Settings)
        if (navigationPath.length === 1) {
            newPath = ['Settings', menu];
        }
        // If we're in a submenu (e.g., General)
        else if (navigationPath.length === 2) {
            // Keep the current path and add the new menu
            newPath = [...navigationPath, menu];
        }
        // If we're already in a sub-submenu, replace the last item
        else {
            newPath = [...navigationPath.slice(0, -1), menu];
        }

        setNavigationPath(newPath);
        setActiveMenu(menu);
    };

    const handleModuleToggle = (moduleName: keyof EnabledModules) => {
        // Update only the temporary state
        setTempModules(prev => ({
            ...prev,
            [moduleName]: !prev[moduleName]
        }));
    };

    const handleModuleSave = () => {
        // Apply changes
        setEnabledModules(tempModules);
        secureLocalStorage.setItem('enabled_modules', JSON.stringify(tempModules));
        window.electron.log('Module settings saved');
        // Optionally close settings
        setIsSettings(false);
        location.reload();
    };



    const handleNavigationClick = (index: number) => {
        // If clicking on 'Settings', reset to main menu
        if (index === 0) {
            setActiveMenu(null);
            setNavigationPath(['Settings']);
            window.electron.log(`Navigation path: ${navigationPath}`);
        }
        // If clicking on a submenu, truncate the path up to that point
        else if (index < navigationPath.length) {
            const newPath = navigationPath.slice(0, index + 1);
            setActiveMenu(navigationPath[index]);
            setNavigationPath(newPath);
            window.electron.log(`Navigation path: ${newPath}`)
        }
    };


    const handleInstallExtension = async () => {
        try {
            setIsInstalling(true);
            const result = await window.spotify.spicetify.installExtension();
            setInstallStatus(result.message);
        } catch (error) {
            setInstallStatus(`Installation failed: ${error.message}`);
        } finally {
            setIsInstalling(false);
        }
    };


    const handleCredentialsHoyo = async () => {
        const idInput = document.querySelector('.hoyo-input') as HTMLInputElement;
        const secretInput = document.querySelector('.hoyo-input-secret') as HTMLInputElement;

        const username = idInput.value;
        const password = secretInput.value;

        secureLocalStorage.setItem('hoyolab_username', username);
        secureLocalStorage.setItem('hoyolab_password', password);


        if (!username || !password) {
            throw new Error('Username or password not found in storage');
        }

        const result = await window.hoyoAPI.login(username, password);
        console.log('Login successful:', result);

        const cookieString = [
            `cookie_token_v2=${result.cookies.cookie_token_v2}`,
            `account_mid_v2=${result.cookies.account_mid_v2}`,
            `account_id_v2=${result.cookies.account_id_v2}`,
            `ltoken_v2=${result.cookies.ltoken_v2}`,
            `ltmid_v2=${result.cookies.ltmid_v2}`,
            `ltuid_v2=${result.cookies.ltuid_v2}`,
        ].join('; ');

        window.hoyoAPI.initialize(cookieString, result.uid);
    }

    const handleCredentialsDiscord = () => {
        const idInput = document.querySelector('.discord-input') as HTMLInputElement;
        const secretInput = document.querySelector('.discord-input-secret') as HTMLInputElement;

        const id = idInput.value;
        const secret = secretInput.value;

        secureLocalStorage.setItem('discord_client_id', id);
        secureLocalStorage.setItem('discord_client_secret', secret);

        // Refreshing discord connection with the new credentials
        window.discord.disconnect();
        window.discord.connect(String(id), String(secret))
    }

    const handleDiscordReset = async () => {
        try {
            await window.discord.revokeAllTokens();
            window.discord.disconnect();
            await window.electron.restart();
        } catch (error) {
            console.error('Error in the middle of discord reset:', error);
        }
    }

    return (
        <div
            className={`settings ${isSettings ? 'show' : ''}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="settings-container">
                {/* Navigation header */}
                <div className="navigation-header">
                    {navigationPath.map((item, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <ArrowForwardIosRounded className="nav-arrow" />
                            )}
                            <span
                                className={`nav-item ${index === navigationPath.length - 1 ? 'active' : ''
                                    }`}
                                onClick={() => handleNavigationClick(index)}
                                role="button"
                                tabIndex={0}
                            >
                                {item}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                {/* Main menu */}
                {navigationPath.length === 1 && (
                    <div className="main-buttons">
                        <button
                            className="settings-button"
                            onClick={() => handleMenuSelect('General')}
                        >
                            General
                        </button>
                        <button
                            className="settings-button"
                            onClick={() => handleMenuSelect('About')}
                        >
                            About
                        </button>
                    </div>
                )}

                {/* About Menu */}
                {activeMenu === 'About' && (
                    <div className="options-menu">
                        <div className="about-content">
                            <div className='basic-details'>
                                <img src={Iris} alt="Iris" className="iris-image" draggable="true"></img>
                                <div className='name-text'>
                                    <span id='title'>Iris</span>
                                    <span id='name'>By Hyperiya</span>
                                </div>
                            </div>
                            <p className="iris-text">
                                Iris is a project created by Hyperiya (That's me!). <br/>
                                It is a project that aims to provide a user-friendly interface for the
                                Spotify, Discord, and Hoyolab APIs. <br/> <br/>
                                Iris © 2025 is licensed under CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License). <br/>
                            </p>
                            <button
                                className="option-button"
                                onClick={() => handleMenuSelect('Lisense')}
                            >
                                Lisense
                            </button>
                        </div>
                    </div>
                )}

                {activeMenu === 'Lisense' && (
                    <div className="options-menu">
                        <div className="about-content">
                            <span className='iris-text'>
                                Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License<br/>
<br/>
By exercising the Licensed Rights (defined below), You accept and agree<br/>
to be bound by the terms and conditions of this Creative Commons<br/>
Attribution-NonCommercial-ShareAlike 4.0 International Public License<br/>
("Public License"). To the extent this Public License may be<br/>
interpreted as a contract, You are granted the Licensed Rights in<br/>
consideration of Your acceptance of these terms and conditions, and the<br/>
Licensor grants You such rights in consideration of benefits the<br/>
Licensor receives from making the Licensed Material available under<br/>
these terms and conditions.<br/>
<br/>
Section 1 -- Definitions.<br/>
<br/>
a. Adapted Material means material subject to Copyright and Similar<br/>
Rights that is derived from or based upon the Licensed Material<br/>
and in which the Licensed Material is translated, altered,<br/>
arranged, transformed, or otherwise modified in a manner requiring<br/>
permission under the Copyright and Similar Rights held by the<br/>
Licensor. For purposes of this Public License, where the Licensed<br/>
Material is a musical work, performance, or sound recording,<br/>
Adapted Material is always produced where the Licensed Material is<br/>
synched in timed relation with a moving image.<br/>
<br/>
b. Adapter's License means the license You apply to Your Copyright<br/>
and Similar Rights in Your contributions to Adapted Material in<br/>
accordance with the terms and conditions of this Public License.<br/>
<br/>
c. BY-NC-SA Compatible License means a license listed at<br/>
creativecommons.org/compatiblelicenses, approved by Creative<br/>
Commons as essentially the equivalent of this Public License.<br/>
<br/>
d. Copyright and Similar Rights means copyright and/or similar rights<br/>
closely related to copyright including, without limitation,<br/>
performance, broadcast, sound recording, and Sui Generis Database<br/>
Rights, without regard to how the rights are labeled or<br/>
categorized. For purposes of this Public License, the rights<br/>
specified in Section 2(b)(1)-(2) are not Copyright and Similar<br/>
Rights.<br/>
<br/>
e. Effective Technological Measures means those measures that, in the<br/>
absence of proper authority, may not be circumvented under laws<br/>
fulfilling obligations under Article 11 of the WIPO Copyright<br/>
Treaty adopted on December 20, 1996, and/or similar international<br/>
agreements.<br/>
<br/>
f. Exceptions and Limitations means fair use, fair dealing, and/or<br/>
any other exception or limitation to Copyright and Similar Rights<br/>
that applies to Your use of the Licensed Material.<br/>
<br/>
g. License Elements means the license attributes listed in the name<br/>
of a Creative Commons Public License. The License Elements of this<br/>
Public License are Attribution, NonCommercial, and ShareAlike.<br/>
<br/>
h. Licensed Material means the artistic or literary work, database,<br/>
or other material to which the Licensor applied this Public<br/>
License.<br/>
<br/>
i. Licensed Rights means the rights granted to You subject to the<br/>
terms and conditions of this Public License, which are limited to<br/>
all Copyright and Similar Rights that apply to Your use of the<br/>
Licensed Material and that the Licensor has authority to license.<br/>
<br/>
j. Licensor means the individual(s) or entity(ies) granting rights<br/>
under this Public License.<br/>
<br/>
k. NonCommercial means not primarily intended for or directed towards<br/>
commercial advantage or monetary compensation. For purposes of<br/>
this Public License, the exchange of the Licensed Material for<br/>
other material subject to Copyright and Similar Rights by digital<br/>
file-sharing or similar means is NonCommercial provided there is<br/>
no payment of monetary compensation in connection with the<br/>
exchange.<br/>
<br/>
l. Share means to provide material to the public by any means or<br/>
process that requires permission under the Licensed Rights, such<br/>
as reproduction, public display, public performance, distribution,<br/>
dissemination, communication, or importation, and to make material<br/>
available to the public including in ways that members of the<br/>
public may access the material from a place and at a time<br/>
individually chosen by them.<br/>
<br/>
m. Sui Generis Database Rights means rights other than copyright<br/>
resulting from Directive 96/9/EC of the European Parliament and of<br/>
the Council of 11 March 1996 on the legal protection of databases,<br/>
as amended and/or succeeded, as well as other essentially<br/>
equivalent rights anywhere in the world.<br/>
<br/>
n. You means the individual or entity exercising the Licensed Rights<br/>
under this Public License. Your has a corresponding meaning.<br/>
<br/>
Section 2 -- Scope.<br/>
<br/>
a. License grant.<br/>
<br/>
       1. Subject to the terms and conditions of this Public License,<br/>
          the Licensor hereby grants You a worldwide, royalty-free,<br/>
          non-sublicensable, non-exclusive, irrevocable license to<br/>
          exercise the Licensed Rights in the Licensed Material to:<br/>
<br/>
            a. reproduce and Share the Licensed Material, in whole or<br/>
               in part, for NonCommercial purposes only; and<br/>
<br/>
            b. produce, reproduce, and Share Adapted Material for<br/>
               NonCommercial purposes only.<br/>
<br/>
       2. Exceptions and Limitations. For the avoidance of doubt, where<br/>
          Exceptions and Limitations apply to Your use, this Public<br/>
          License does not apply, and You do not need to comply with<br/>
          its terms and conditions.<br/>
<br/>
       3. Term. The term of this Public License is specified in Section<br/>
          6(a).<br/>
<br/>
       4. Media and formats; technical modifications allowed. The<br/>
          Licensor authorizes You to exercise the Licensed Rights in<br/>
          all media and formats whether now known or hereafter created,<br/>
          and to make technical modifications necessary to do so. The<br/>
          Licensor waives and/or agrees not to assert any right or<br/>
          authority to forbid You from making technical modifications<br/>
          necessary to exercise the Licensed Rights, including<br/>
          technical modifications necessary to circumvent Effective<br/>
          Technological Measures. For purposes of this Public License,<br/>
          simply making modifications authorized by this Section 2(a)<br/>
          (4) never produces Adapted Material.<br/>
<br/>
       5. Downstream recipients.<br/>
<br/>
            a. Offer from the Licensor -- Licensed Material. Every<br/>
               recipient of the Licensed Material automatically<br/>
               receives an offer from the Licensor to exercise the<br/>
               Licensed Rights under the terms and conditions of this<br/>
               Public License.<br/>
<br/>
            b. Additional offer from the Licensor -- Adapted Material.<br/>
               Every recipient of Adapted Material from You<br/>
               automatically receives an offer from the Licensor to<br/>
               exercise the Licensed Rights in the Adapted Material<br/>
               under the conditions of the Adapter's License You apply.<br/>
<br/>
            c. No downstream restrictions. You may not offer or impose<br/>
               any additional or different terms or conditions on, or<br/>
               apply any Effective Technological Measures to, the<br/>
               Licensed Material if doing so restricts exercise of the<br/>
               Licensed Rights by any recipient of the Licensed<br/>
               Material.<br/>
<br/>
       6. No endorsement. Nothing in this Public License constitutes or<br/>
          may be construed as permission to assert or imply that You<br/>
          are, or that Your use of the Licensed Material is, connected<br/>
          with, or sponsored, endorsed, or granted official status by,<br/>
          the Licensor or others designated to receive attribution as<br/>
          provided in Section 3(a)(1)(A)(i).<br/>
<br/>
b. Other rights.<br/>
<br/>
       1. Moral rights, such as the right of integrity, are not<br/>
          licensed under this Public License, nor are publicity,<br/>
          privacy, and/or other similar personality rights; however, to<br/>
          the extent possible, the Licensor waives and/or agrees not to<br/>
          assert any such rights held by the Licensor to the limited<br/>
          extent necessary to allow You to exercise the Licensed<br/>
          Rights, but not otherwise.<br/>
<br/>
       2. Patent and trademark rights are not licensed under this<br/>
          Public License.<br/>
<br/>
       3. To the extent possible, the Licensor waives any right to<br/>
          collect royalties from You for the exercise of the Licensed<br/>
          Rights, whether directly or through a collecting society<br/>
          under any voluntary or waivable statutory or compulsory<br/>
          licensing scheme. In all other cases the Licensor expressly<br/>
          reserves any right to collect such royalties, including when<br/>
          the Licensed Material is used other than for NonCommercial<br/>
          purposes.<br/>
<br/>
Section 3 -- License Conditions.<br/>
<br/>
Your exercise of the Licensed Rights is expressly made subject to the<br/>
following conditions.<br/>
<br/>
a. Attribution.<br/>
<br/>
       1. If You Share the Licensed Material (including in modified<br/>
          form), You must:<br/>
<br/>
            a. retain the following if it is supplied by the Licensor<br/>
               with the Licensed Material:<br/>
<br/>
                 i. identification of the creator(s) of the Licensed<br/>
                    Material and any others designated to receive<br/>
                    attribution, in any reasonable manner requested by<br/>
                    the Licensor (including by pseudonym if<br/>
                    designated);<br/>
<br/>
                ii. a copyright notice;<br/>
<br/>
               iii. a notice that refers to this Public License;<br/>
<br/>
                iv. a notice that refers to the disclaimer of<br/>
                    warranties;<br/>
<br/>
                 v. a URI or hyperlink to the Licensed Material to the<br/>
                    extent reasonably practicable;<br/>
<br/>
            b. indicate if You modified the Licensed Material and<br/>
               retain an indication of any previous modifications; and<br/>
<br/>
            c. indicate the Licensed Material is licensed under this<br/>
               Public License, and include the text of, or the URI or<br/>
               hyperlink to, this Public License.<br/>
<br/>
       2. You may satisfy the conditions in Section 3(a)(1) in any<br/>
          reasonable manner based on the medium, means, and context in<br/>
          which You Share the Licensed Material. For example, it may be<br/>
          reasonable to satisfy the conditions by providing a URI or<br/>
          hyperlink to a resource that includes the required<br/>
          information.<br/>
       3. If requested by the Licensor, You must remove any of the<br/>
          information required by Section 3(a)(1)(A) to the extent<br/>
          reasonably practicable.<br/>
<br/>
b. ShareAlike.<br/>
<br/>
     In addition to the conditions in Section 3(a), if You Share<br/>
     Adapted Material You produce, the following conditions also apply.<br/>
<br/>
       1. The Adapter's License You apply must be a Creative Commons<br/>
          license with the same License Elements, this version or<br/>
          later, or a BY-NC-SA Compatible License.<br/>
<br/>
       2. You must include the text of, or the URI or hyperlink to, the<br/>
          Adapter's License You apply. You may satisfy this condition<br/>
          in any reasonable manner based on the medium, means, and<br/>
          context in which You Share Adapted Material.<br/>
<br/>
       3. You may not offer or impose any additional or different terms<br/>
          or conditions on, or apply any Effective Technological<br/>
          Measures to, Adapted Material that restrict exercise of the<br/>
          rights granted under the Adapter's License You apply.<br/>
<br/>
Section 4 -- Sui Generis Database Rights.<br/>
<br/>
Where the Licensed Rights include Sui Generis Database Rights that<br/>
apply to Your use of the Licensed Material:<br/>
<br/>
a. for the avoidance of doubt, Section 2(a)(1) grants You the right<br/>
to extract, reuse, reproduce, and Share all or a substantial<br/>
portion of the contents of the database for NonCommercial purposes<br/>
only;<br/>
<br/>
b. if You include all or a substantial portion of the database<br/>
contents in a database in which You have Sui Generis Database<br/>
Rights, then the database in which You have Sui Generis Database<br/>
Rights (but not its individual contents) is Adapted Material,<br/>
including for purposes of Section 3(b); and<br/>
<br/>
c. You must comply with the conditions in Section 3(a) if You Share<br/>
all or a substantial portion of the contents of the database.<br/>
<br/>
For the avoidance of doubt, this Section 4 supplements and does not<br/>
replace Your obligations under this Public License where the Licensed<br/>
Rights include other Copyright and Similar Rights.<br/>
<br/>
Section 5 -- Disclaimer of Warranties and Limitation of Liability.<br/>
<br/>
a. UNLESS OTHERWISE SEPARATELY UNDERTAKEN BY THE LICENSOR, TO THE<br/>
EXTENT POSSIBLE, THE LICENSOR OFFERS THE LICENSED MATERIAL AS-IS<br/>
AND AS-AVAILABLE, AND MAKES NO REPRESENTATIONS OR WARRANTIES OF<br/>
ANY KIND CONCERNING THE LICENSED MATERIAL, WHETHER EXPRESS,<br/>
IMPLIED, STATUTORY, OR OTHER. THIS INCLUDES, WITHOUT LIMITATION,<br/>
WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR<br/>
PURPOSE, NON-INFRINGEMENT, ABSENCE OF LATENT OR OTHER DEFECTS,<br/>
ACCURACY, OR THE PRESENCE OR ABSENCE OF ERRORS, WHETHER OR NOT<br/>
KNOWN OR DISCOVERABLE. WHERE DISCLAIMERS OF WARRANTIES ARE NOT<br/>
ALLOWED IN FULL OR IN PART, THIS DISCLAIMER MAY NOT APPLY TO YOU.<br/>
<br/>
b. TO THE EXTENT POSSIBLE, IN NO EVENT WILL THE LICENSOR BE LIABLE<br/>
TO YOU ON ANY LEGAL THEORY (INCLUDING, WITHOUT LIMITATION,<br/>
NEGLIGENCE) OR OTHERWISE FOR ANY DIRECT, SPECIAL, INDIRECT,<br/>
INCIDENTAL, CONSEQUENTIAL, PUNITIVE, EXEMPLARY, OR OTHER LOSSES,<br/>
COSTS, EXPENSES, OR DAMAGES ARISING OUT OF THIS PUBLIC LICENSE OR<br/>
USE OF THE LICENSED MATERIAL, EVEN IF THE LICENSOR HAS BEEN<br/>
ADVISED OF THE POSSIBILITY OF SUCH LOSSES, COSTS, EXPENSES, OR<br/>
DAMAGES. WHERE A LIMITATION OF LIABILITY IS NOT ALLOWED IN FULL OR<br/>
IN PART, THIS LIMITATION MAY NOT APPLY TO YOU.<br/>
<br/>
c. The disclaimer of warranties and limitation of liability provided<br/>
above shall be interpreted in a manner that, to the extent<br/>
possible, most closely approximates an absolute disclaimer and<br/>
waiver of all liability.<br/>
<br/>
Section 6 -- Term and Termination.<br/>
<br/>
a. This Public License applies for the term of the Copyright and<br/>
Similar Rights licensed here. However, if You fail to comply with<br/>
this Public License, then Your rights under this Public License<br/>
terminate automatically.<br/>
<br/>
b. Where Your right to use the Licensed Material has terminated under<br/>
Section 6(a), it reinstates:<br/>
<br/>
       1. automatically as of the date the violation is cured, provided<br/>
          it is cured within 30 days of Your discovery of the<br/>
          violation; or<br/>
<br/>
       2. upon express reinstatement by the Licensor.<br/>
<br/>
     For the avoidance of doubt, this Section 6(b) does not affect any<br/>
     right the Licensor may have to seek remedies for Your violations<br/>
     of this Public License.<br/>
<br/>
c. For the avoidance of doubt, the Licensor may also offer the<br/>
Licensed Material under separate terms or conditions or stop<br/>
distributing the Licensed Material at any time; however, doing so<br/>
will not terminate this Public License.<br/>
<br/>
d. Sections 1, 5, 6, 7, and 8 survive termination of this Public<br/>
License.<br/>
<br/>
Section 7 -- Other Terms and Conditions.<br/>
<br/>
a. The Licensor shall not be bound by any additional or different<br/>
terms or conditions communicated by You unless expressly agreed.<br/>
<br/>
b. Any arrangements, understandings, or agreements regarding the<br/>
Licensed Material not stated herein are separate from and<br/>
independent of the terms and conditions of this Public License.<br/>
<br/>
Section 8 -- Interpretation.<br/>
<br/>
a. For the avoidance of doubt, this Public License does not, and<br/>
shall not be interpreted to, reduce, limit, restrict, or impose<br/>
conditions on any use of the Licensed Material that could lawfully<br/>
be made without permission under this Public License.<br/>
<br/>
b. To the extent possible, if any provision of this Public License is<br/>
deemed unenforceable, it shall be automatically reformed to the<br/>
minimum extent necessary to make it enforceable. If the provision<br/>
cannot be reformed, it shall be severed from this Public License<br/>
without affecting the enforceability of the remaining terms and<br/>
conditions.<br/>
<br/>
c. No term or condition of this Public License will be waived and no<br/>
failure to comply consented to unless expressly agreed to by the<br/>
Licensor.<br/>
<br/>
d. Nothing in this Public License constitutes or may be interpreted<br/>
as a limitation upon, or waiver of, any privileges and immunities<br/>
that apply to the Licensor or You, including from the legal<br/>
processes of any jurisdiction or authority.<br/>
<br/>
=======================================================================<br/>
Trademarks<br/>
<br/>
Trademark and Asset Acknowledgment - COGNOSPHERE<br/>
<br/>
The HoYoverse icon and the name "HoYoLAB" are trademarks and copyrighted materials owned by COGNOSPHERE PTE. LTD. (formerly known as miHoYo) and its affiliates. These assets are used in this application for identification purposes only. This project is not affiliated with, endorsed by, or sponsored by COGNOSPHERE PTE. LTD.<br/>
<br/>
All rights to these trademarks and copyrighted materials remain the property of their respective owners. Their use in this application does not grant any rights or licenses to these trademarks and copyrighted materials beyond what is strictly necessary for identification purposes.<br/>
<br/>
Trademark and Asset Acknowledgment - Spotify<br/>
<br/>
The Spotify name, logo, and related assets are trademarks and copyrighted materials owned by Spotify AB and its affiliates. These assets are used in this application for identification purposes only. This project is not affiliated with, endorsed by, or sponsored by Spotify AB.<br/>
<br/>
All rights to Spotify's trademarks, copyrighted materials, and intellectual property remain the property of their respective owners. Their use in this application does not grant any rights or licenses to these trademarks and copyrighted materials beyond what is strictly necessary for identification and integration purposes under Spotify's Developer Terms of Service.<br/>
<br/>
Trademark and Asset Acknowledgment - Discord<br/>
<br/>
The Discord name, logo, and related assets are trademarks and copyrighted materials owned by Discord Inc. and its affiliates. These assets are used in this application for identification purposes only. This project is not affiliated with, endorsed by, or sponsored by Discord Inc.<br/>
<br/>
This application uses Discord's RPC API and follows Discord's Developer Terms of Service. All rights to Discord's trademarks, copyrighted materials, and intellectual property remain the property of their respective owners. Their use in this application does not grant any rights or licenses to these trademarks and copyrighted materials beyond what is strictly necessary for identification and integration purposes under Discord's Developer Terms of Service.<br/>
<br/>
                            </span>
                        </div>
                    </div>
                )}

                {/* Sub menus */}
                {activeMenu === 'General' && (
                    <div className="options-menu">
                        <div className="options-list">
                            {generalOptions.map((option, index) => (
                                <button
                                    key={index}
                                    className="option-button"
                                    onClick={() => handleMenuSelect(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}



                {/* Spotify Settings section */}
                {activeMenu === 'Spotify Settings' && (
                    <div className="options-menu">
                        <div className="settings-section">
                            <h3>Spicetify Extension</h3>
                            <button
                                className="install-button"
                                onClick={handleInstallExtension}
                            >
                                Install Spicetify Extension
                            </button>
                            {installStatus && (
                                <div className={`install-status ${installStatus.includes('failed') ? 'error' : 'success'
                                    }`}>
                                    {installStatus}
                                </div>
                            )}
                            {isInstalling && <div className="install-status installing">Installing...</div>}
                        </div>
                    </div>
                )}



                {/* Hoyoverse Settings section */}
                {activeMenu === 'Hoyolab Settings' && (
                    <div className="options-menu">
                        <div className="credentials">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Hoyolab Username/Email"
                                    className="hoyo-input"
                                    id='input-bar'
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Hoyolab Password"
                                    className="hoyo-input-secret"
                                    id='input-bar'
                                />
                            </div>
                            <div className="save-input">
                                <button id='input-button' className="save-button" onClick={handleCredentialsHoyo}>Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Discord Settings section */}
                {activeMenu === 'Discord Settings' && (
                    <div className="options-menu">
                        <div className="credentials">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Discord Client ID"
                                    className="discord-input"
                                    id='input-bar'
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Discord Client Secret"
                                    className="discord-input-secret"
                                    id='input-bar'
                                />
                            </div>

                            <div className="save-input">
                                <button id='input-button' className="save-button" onClick={handleCredentialsDiscord}>Save</button>
                                <button id='input-button' className="reset-button" onClick={handleDiscordReset}>Reset</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeMenu === 'Modules' && (
                    <div className="options-menu">
                        <div className="settings-section">
                            <div className="module-toggles">
                                {modules.map((module) => (

                                    <div key={module} className="module-toggle">
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={tempModules[module]}
                                                onChange={() => handleModuleToggle(module)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                        <span className="module-name">
                                            {module.charAt(0).toUpperCase() + module.slice(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="save-input">
                                <button
                                    id='input-button'
                                    className="save-button"
                                    onClick={handleModuleSave}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
};



export default Settings;
