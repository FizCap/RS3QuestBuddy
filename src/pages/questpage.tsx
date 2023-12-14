// QuestPage.js
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Flex, Stepper } from "@mantine/core";
import ReactDOM from "react-dom";
import QuestControls from "./QuestControls";
import "./../index.css";

const QuestPage: React.FC = () => {
    // State and variables
    const qpname = useLocation();
    const { questName, modified } = qpname.state;
    const [stepDetails, setStepDetails] = useState<string[]>([]);
    const questStepJSON = "./QuestList.json";
    const textfile = modified + "info.txt";
    const [active, setActive] = useState(0);
    const [highestStepVisited, setHighestStepVisited] = useState(active);
    const [buttonVisible, setButtonVisible] = useState(true);
    const navigate = useNavigate();
    const [popOutWindow, setPopOutWindow] = useState<Window | null>(null);
    const [, setPopOutClicked] = useState(false);

    // Effect for initializing stepRefs
    const stepRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
    useEffect(() => {
        stepRefs.current = Array.from({ length: stepDetails.length }, () =>
            React.createRef()
        );
    }, [stepDetails.length]);

    // Functions

    // Handles popping in and out the quest controls
    const handlePopOut = () => {
        if (popOutWindow && !popOutWindow.closed) {
            // If open, close the window
            popOutWindow.close();
            setPopOutWindow(null);
            setButtonVisible(true); // Show the buttons again
            setPopOutClicked(true);
        } else {
            // If not open, open a new browser window
            const newWindow = window.open("", "", "width=237,height=90");
            if (newWindow) {
                // Set the pop-out window and hide buttons in the current window
                setPopOutWindow(newWindow);
                setButtonVisible(false);
                setPopOutClicked(false);

                // Render the QuestControls component into the new window
                const container: HTMLDivElement =
                    newWindow.document.createElement("div");
                container.className = "ButtonGroupTwo";
                newWindow.document.body.appendChild(container);
                newWindow.document.title = "Quest Controls";

                // Set initial content for the new window
                const initialContentContainer =
                    newWindow.document.createElement("div");
                initialContentContainer.id = "initialContentContainer";
                newWindow.document.body.appendChild(initialContentContainer);

                const iconLink = newWindow.document.createElement("link");
                iconLink.rel = "icon";
                iconLink.href = "./src/assets/rs3buddyicon.png";
                newWindow.document.head.appendChild(iconLink);

                // Function to copy styles from the original window to the new window
                function copyStyles(): void {
                    const stylesheets: NodeListOf<
                        HTMLStyleElement | HTMLLinkElement
                    > = document.querySelectorAll(
                        'style, link[rel="stylesheet"]'
                    );
                    const stylesheetsArray: HTMLStyleElement[] =
                        Array.from(stylesheets);

                    stylesheetsArray.forEach(function (
                        stylesheet: HTMLStyleElement
                    ) {
                        copyStyle(window, newWindow!, stylesheet);
                    });
                }

                // Call the function to copy styles
                copyStyles();

                // Render QuestControls into the new window
                ReactDOM.render(
                    <QuestControls
                        scrollNext={scrollNext}
                        scrollPrev={scrollPrev}
                        handleStepChange={setActiveAndScroll}
                    />,
                    container
                );
            }
        }
    };

    // Function to copy styles from one window to another
    function copyStyle(
        _from: Window,
        to: Window,
        node: HTMLStyleElement | HTMLLinkElement
    ): void {
        const doc: Document = to.document;

        if (node.tagName === "STYLE") {
            // If it's a style element, create a new style element
            const newStyle: HTMLStyleElement = doc.createElement("style");

            if (node.textContent) {
                newStyle.textContent = node.textContent;
            } else if ("innerText" in node && node.innerText) {
                newStyle.innerText = node.innerText;
            }

            doc.head.appendChild(newStyle);
        } else if (node.tagName === "LINK" && "rel" in node) {
            // If it's a link element, create a new link element
            const newLink: HTMLLinkElement = doc.createElement("link");

            if ("rel" in node) {
                newLink.rel = node.rel;
            }

            newLink.href = node.href;
            newLink.type = node.type;

            doc.head.appendChild(newLink);
        }
    }

    // Sets active step and scrolls into view
    const setActiveAndScroll = (nextStep: number) => {
        if (nextStep >= 0 && nextStep < stepDetails.length) {
            setActive(nextStep);
            setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
            stepRefs.current[nextStep].current?.scrollIntoView({
                behavior: "smooth",
            });
        }
    };

    // Handles step change
    const handleStepChange = (nextStep: number) => {
        const stepLength = stepDetails.length;
        const isOutOfBoundsBottom = nextStep > stepLength;
        const isOutOfBoundsTop = stepLength < 0;

        if (isOutOfBoundsBottom) {
            return window.alert("Cannot go forward");
        } else if (isOutOfBoundsTop) {
            return window.alert("Cannot go back");
        } else {
            setActive(nextStep);
            setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
        }
    };

    // Scrolls to the next step
    const scrollNext = () => {
        const nextStep = active + 1;
        scrollIntoView(nextStep);
    };

    // Scrolls to the previous step
    const scrollPrev = () => {
        const prevStep = active - 1;
        scrollIntoView(prevStep);
    };

    // Scrolls into view based on step
    const scrollIntoView = (step: number) => {
        const element = document.getElementById(step.toString());
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    // Handles going back to the main page
    const handleBackButton = () => {
        navigate("/");
    };

    // Allows the user to freely go back and forth between visited steps
    const shouldAllowSelectStep = (step: number) =>
        highestStepVisited >= step && active !== step;

    // Fetches the path for the current step
    useEffect(() => {
        const fetchStepPath = async () => {
            try {
                const response = await fetch(questStepJSON);
                const file = await response.json();

                const normalizedTextFile = textfile
                    .toLowerCase()
                    .replace(/\s+/g, "");

                const foundStep = file.find((value: { Quest: string }) => {
                    let pattern = /[!,`']/g;
                    const normalizedValue =
                        value.Quest.toLowerCase()
                            .split(" ")
                            .join("")
                            .replace(pattern, "") + "info.txt";

                    return normalizedValue === normalizedTextFile;
                });

                if (foundStep) {
                    return foundStep.Path;
                } else {
                    console.error(
                        "Step not found for textfile:",
                        normalizedTextFile
                    );
                    return null;
                }
            } catch (error) {
                console.error(
                    "Error fetching or processing quest list:",
                    error
                );
                return null;
            }
        };

        const fetchData = async () => {
            try {
                const stepPath = await fetchStepPath();
                if (stepPath) {
                    const response = await fetch(stepPath);
                    const text = await response.text();
                    const textSteps = text.split("`");
                    setStepDetails(textSteps);
                }
            } catch (error) {
                console.error("Steps Could Not Load", error);
            }
        };

        fetchData();
    }, [textfile, questStepJSON]);

    // Rendered content
    return (
        <>
            <div>
                <h2 className="qpTitle">{questName}</h2>
            </div>
            {buttonVisible && (
                <Flex className="prevNextGroup" gap="sm">
                    <Button
                        variant="outline"
                        onClick={() => {
                            scrollPrev();
                            handleStepChange(active - 1);
                        }}
                    >
                        Prev Step
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            handleStepChange(active + 1);
                            scrollNext();
                        }}
                    >
                        Next Step
                    </Button>
                </Flex>
            )}
            <Flex
                className=""
                gap="sm"
                justify="flex-start"
                align="flex-start"
                direction="column"
                wrap="wrap"
            >
                {popOutWindow ? (
                    <Button variant="outline" onClick={handlePopOut}>
                        Pop In Quest Controls
                    </Button>
                ) : (
                    <Button variant="outline" onClick={handlePopOut}>
                        Pop Out Quest Controls
                    </Button>
                )}
                <Button variant="outline" onClick={handleBackButton}>
                    Pick Quest
                </Button>
            </Flex>
            <Stepper
                className="stepperContainer"
                active={active}
<<<<<<< HEAD
                onStepClick={setActiveAndScroll}
=======
                onStepClick={setActive}
>>>>>>> f6034e64812958c1a442f0d2315901f8d221c488
                orientation="vertical"
            >
                {stepDetails.map((value, index) => (
                    <Stepper.Step
                        id={index.toString()}
                        className="stepperStep"
                        label={`Step: ${index + 1}`}
                        key={index}
                        orientation="vertical"
                        description={value}
                        allowStepSelect={shouldAllowSelectStep(index)}
                    />
                ))}
            </Stepper>
        </>
    );
};

export default QuestPage;
