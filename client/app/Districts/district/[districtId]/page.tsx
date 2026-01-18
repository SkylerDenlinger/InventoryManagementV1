import styles from './page.module.css';

type PageProps = {
    params: {
        districtId: string;
        locationId: string;
    };
};

export default async function districtPage({ params }: PageProps) {
    const { districtId } = await params;

    return (
        <div className = {styles.pageDiv}>
            <h1>District {districtId}</h1>
        </div>
    );
}