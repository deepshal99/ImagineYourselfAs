import React from 'react';

interface MetaHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}

const MetaHead: React.FC<MetaHeadProps> = ({
    title = "PosterMe - Cast Yourself in Blockbuster Movies with AI",
    description = "Instant AI casting. Upload a selfie and become the star of Dune, Batman, Barbie, and more. No design skills needed.",
    image = "/personas/movie_batman.webp", // Default to batman if not provided
    url = typeof window !== 'undefined' ? window.location.href : 'https://posterme.app/'
}) => {
    // Ensure absolute URL for images
    const imageUrl = image.startsWith('http') ? image : `https://posterme.app${image.startsWith('/') ? '' : '/'}${image}`;
    const pageUrl = url;

    return (
        <>
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={imageUrl} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={pageUrl} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={imageUrl} />
        </>
    );
};

export default MetaHead;
